import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFacultyTools } from "@/lib/roles";
import { canManageClubAttendanceSession } from "@/lib/flex-attendance";
import {
  checkRateLimit,
  getRequestIp,
  sanitizeAttachmentFilename,
  withStandardApiHeaders,
  withRateLimitHeaders,
} from "@/lib/security";
import { buildAttendanceCsv, buildAttendancePdf, buildAttendanceRows } from "@/lib/attendance-export";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return withStandardApiHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const format = searchParams.get("format");

  if (!sessionId || !["csv", "pdf"].includes(format || "")) {
    return withStandardApiHeaders(NextResponse.json({ error: "Missing export parameters" }, { status: 400 }));
  }

  const rateLimit = checkRateLimit({
    key: `flex-export:${session.user.id}:${getRequestIp(request)}:${sessionId}:${format}`,
    limit: 12,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return withStandardApiHeaders(
      withRateLimitHeaders(
        NextResponse.json({ error: "Too many export requests. Please wait a moment." }, { status: 429 }),
        rateLimit
      )
    );
  }

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      clubId: true,
      createdById: true,
      records: {
        orderBy: [{ status: "asc" }, { user: { name: "asc" } }],
        include: {
          user: {
            select: {
              name: true,
              email: true,
              grade: true,
            },
          },
        },
      },
    },
  });

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

  const rows = buildAttendanceRows(attendanceSession.records);
  const filenameBase = sanitizeAttachmentFilename(attendanceSession.title, "attendance");

  if (format === "csv") {
    return withStandardApiHeaders(
      withRateLimitHeaders(
        new NextResponse(buildAttendanceCsv(attendanceSession.title, rows), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filenameBase}-attendance.csv"`,
          },
        }),
        rateLimit
      )
    );
  }

  return withStandardApiHeaders(
    withRateLimitHeaders(
      new NextResponse(buildAttendancePdf(attendanceSession.title, rows), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filenameBase}-attendance.pdf"`,
        },
      }),
      rateLimit
    )
  );
}
