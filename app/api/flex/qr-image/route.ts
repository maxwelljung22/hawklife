import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  checkRateLimit,
  getRequestIp,
  rejectCrossSiteRequest,
  withRateLimitHeaders,
  withStandardApiHeaders,
} from "@/lib/security";

const DEFAULT_QR_SIZE = 720;
const MIN_QR_SIZE = 160;
const MAX_QR_SIZE = 1024;

function parseQrSize(value: string | null) {
  const parsed = Number(value ?? DEFAULT_QR_SIZE);
  if (!Number.isFinite(parsed)) return DEFAULT_QR_SIZE;
  return Math.max(MIN_QR_SIZE, Math.min(MAX_QR_SIZE, Math.floor(parsed)));
}

export async function GET(request: Request) {
  const crossSiteError = rejectCrossSiteRequest(request);
  if (crossSiteError) return crossSiteError;

  const session = await auth();
  if (!session?.user) {
    return withStandardApiHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const value = searchParams.get("value");
  const size = parseQrSize(searchParams.get("size"));

  if (!value || value.length > 4096) {
    return withStandardApiHeaders(NextResponse.json({ error: "Missing QR payload" }, { status: 400 }));
  }

  const rateLimit = checkRateLimit({
    key: `flex-qr-image:${session.user.id}:${getRequestIp(request)}`,
    limit: 180,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return withStandardApiHeaders(
      withRateLimitHeaders(
        NextResponse.json({ error: "Too many QR image requests. Please wait a moment." }, { status: 429 }),
        rateLimit
      )
    );
  }

  const upstreamUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  const upstream = await fetch(upstreamUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(6_000),
    headers: {
      Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
      "User-Agent": "HawkLife QR Proxy",
    },
  });

  if (!upstream.ok) {
    return withStandardApiHeaders(
      withRateLimitHeaders(
        NextResponse.json({ error: "Couldn't render the QR code right now." }, { status: 502 }),
        rateLimit
      )
    );
  }

  const buffer = await upstream.arrayBuffer();
  const response = new NextResponse(buffer, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });

  return withStandardApiHeaders(withRateLimitHeaders(response, rateLimit));
}
