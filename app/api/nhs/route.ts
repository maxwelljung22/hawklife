// app/api/nhs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllNhsRecords, getNhsRecordForUser } from "@/lib/airtable";
import { canAccessAdmin, canAccessFacultyTools } from "@/lib/roles";
import { getSession } from "@/lib/session";
import {
  rejectUntrustedOrigin,
  checkRateLimit,
  getRequestIp,
  withStandardApiHeaders,
  withRateLimitHeaders,
} from "@/lib/security";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return withStandardApiHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const rateLimit = checkRateLimit({
    key: `nhs:get:${session.user.id}:${getRequestIp(req)}:${all ? "all" : "mine"}`,
    limit: all ? 20 : 60,
    windowMs: 60_000,
  });

  if (!rateLimit.success) {
    return withStandardApiHeaders(
      withRateLimitHeaders(
        NextResponse.json({ error: "Too many NHS requests. Please wait a moment." }, { status: 429 }),
        rateLimit
      )
    );
  }

  if (all && !canAccessFacultyTools(session.user.role)) {
    return withStandardApiHeaders(
      withRateLimitHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }), rateLimit)
    );
  }

  try {
    if (all) {
      const records = await getAllNhsRecords();
      return withStandardApiHeaders(withRateLimitHeaders(NextResponse.json({ records }), rateLimit));
    } else {
      const record = await getNhsRecordForUser(session.user.email!, session.user.name);
      return withStandardApiHeaders(withRateLimitHeaders(NextResponse.json({ record }), rateLimit));
    }
  } catch (err: any) {
    console.error("[NHS API]", err);
    return withStandardApiHeaders(
      withRateLimitHeaders(NextResponse.json({ error: "Failed to fetch NHS data" }, { status: 500 }), rateLimit)
    );
  }
}

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const session = await getSession();
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    return withStandardApiHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }

  const rateLimit = checkRateLimit({
    key: `nhs:post:${session.user.id}:${getRequestIp(req)}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return withStandardApiHeaders(
      withRateLimitHeaders(
        NextResponse.json({ error: "Too many sync attempts. Please wait a minute." }, { status: 429 }),
        rateLimit
      )
    );
  }

  const { syncNhsNow } = await import("@/lib/airtable");
  const result = await syncNhsNow();
  return withStandardApiHeaders(withRateLimitHeaders(NextResponse.json(result), rateLimit));
}
