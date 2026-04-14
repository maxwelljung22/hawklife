import { NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, RateLimitRecord>;
  rateLimitLastSweepAt?: number;
};

const rateLimitStore = globalForRateLimit.rateLimitStore ?? new Map<string, RateLimitRecord>();

if (!globalForRateLimit.rateLimitStore) {
  globalForRateLimit.rateLimitStore = rateLimitStore;
}

function sweepExpiredRateLimits(now: number) {
  const lastSweepAt = globalForRateLimit.rateLimitLastSweepAt ?? 0;
  if (now - lastSweepAt < RATE_LIMIT_SWEEP_INTERVAL_MS) return;

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  globalForRateLimit.rateLimitLastSweepAt = now;
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function getTrustedOrigins(request: Request) {
  const origins = new Set<string>();

  try {
    origins.add(new URL(request.url).origin);
  } catch {}

  const configuredOrigin = process.env.NEXTAUTH_URL?.trim();
  if (configuredOrigin) origins.add(configuredOrigin);

  if (configuredOrigin && configuredOrigin.startsWith("https://")) {
    const host = configuredOrigin.replace(/^https:\/\//, "");
    if (host.startsWith("www.")) {
      origins.add(`https://${host.slice(4)}`);
    } else {
      origins.add(`https://www.${host}`);
    }
  }

  return origins;
}

export function applySecurityHeaders(response: NextResponse) {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    process.env.NODE_ENV === "development"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https:",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("Origin-Agent-Cluster", "?1");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return response;
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  sweepExpiredRateLimits(now);
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(key, next);
    return {
      success: true as const,
      remaining: limit - 1,
      resetAt: next.resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false as const,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    success: true as const,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function withRateLimitHeaders(
  response: NextResponse,
  rateLimit: { remaining: number; resetAt: number; success?: boolean }
) {
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, rateLimit.remaining)));
  response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
  if (rateLimit.success === false) {
    response.headers.set("Retry-After", String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))));
  }
  return response;
}

export function applyNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export function isTrustedOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const trustedOrigins = getTrustedOrigins(request);

  if (origin) {
    return trustedOrigins.has(origin);
  }

  const referer = request.headers.get("referer");
  if (!referer) return true;

  try {
    return trustedOrigins.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

export function rejectUntrustedOrigin(request: Request) {
  if (isTrustedOriginRequest(request)) return null;

  return applySecurityHeaders(
    applyNoStore(NextResponse.json({ error: "Untrusted request origin" }, { status: 403 }))
  );
}

export function withStandardApiHeaders(response: NextResponse) {
  return applySecurityHeaders(applyNoStore(response));
}

export function rejectCrossSiteRequest(request: Request) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (!secFetchSite || ["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return null;
  }

  return applySecurityHeaders(
    applyNoStore(NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 }))
  );
}

export function sanitizeAttachmentFilename(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}
