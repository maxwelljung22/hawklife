import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFacultyTools } from "@/lib/roles";
import { canManageClubAttendanceSession, createQrValue, createStaticQrValue } from "@/lib/flex-attendance";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";
import {
  checkRateLimit,
  getRequestIp,
  rejectCrossSiteRequest,
  withStandardApiHeaders,
  withRateLimitHeaders,
} from "@/lib/security";

export async function GET(request: Request) {
  const crossSiteError = rejectCrossSiteRequest(request);
  if (crossSiteError) return crossSiteError;

  const session = await auth();
  if (!session?.user) {
    return withStandardApiHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const mode = searchParams.get("mode");
  if (!sessionId) {
    return withStandardApiHeaders(NextResponse.json({ error: "Missing session id" }, { status: 400 }));
  }

  const rateLimit = checkRateLimit({
    key: `flex-qr:${session.user.id}:${getRequestIp(request)}:${sessionId}`,
    limit: 90,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return withStandardApiHeaders(
      withRateLimitHeaders(
        NextResponse.json({ error: "Too many QR refresh requests. Please wait a moment." }, { status: 429 }),
        rateLimit
      )
    );
  }

  let attendanceSession;
  try {
    attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        title: true,
        clubId: true,
        createdById: true,
        qrCode: true,
        qrRefreshSeconds: true,
      },
    });
  } catch (error) {
    if (isPrismaMissingColumnError(error, "Attendance")) {
      return withStandardApiHeaders(
        withRateLimitHeaders(
          NextResponse.json(
            { error: "The attendance schema has not been applied to this deployment yet." },
            { status: 503 }
          ),
          rateLimit
        )
      );
    }

    throw error;
  }

  if (!attendanceSession) {
    return withStandardApiHeaders(
      withRateLimitHeaders(NextResponse.json({ error: "Session not found" }, { status: 404 }), rateLimit)
    );
  }

  const canManage = attendanceSession.clubId
    ? await canManageClubAttendanceSession(attendanceSession.clubId, session.user.id, session.user.role)
    : canAccessFacultyTools(session.user.role) || attendanceSession.createdById === session.user.id;

  if (!canManage) {
    return withStandardApiHeaders(
      withRateLimitHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }), rateLimit)
    );
  }

  const staticMode = mode === "static";
  const qrValue = staticMode ? createStaticQrValue(attendanceSession) : createQrValue(attendanceSession);

  return withStandardApiHeaders(
    withRateLimitHeaders(
      NextResponse.json({
        qrValue,
        expiresAt: staticMode ? null : Date.now() + attendanceSession.qrRefreshSeconds * 1000,
        title: attendanceSession.title,
        refreshSeconds: staticMode ? null : attendanceSession.qrRefreshSeconds,
        mode: staticMode ? "static" : "rotating",
      }),
      rateLimit
    )
  );
}
