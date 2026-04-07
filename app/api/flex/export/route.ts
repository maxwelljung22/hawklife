import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFacultyTools } from "@/lib/roles";
import { canManageClubAttendanceSession } from "@/lib/flex-attendance";
import { applySecurityHeaders } from "@/lib/security";
import { buildAttendanceCsv, buildAttendancePdf, buildAttendanceRows } from "@/lib/attendance-export";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return applySecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const format = searchParams.get("format");

  if (!sessionId || !["csv", "pdf"].includes(format || "")) {
    return applySecurityHeaders(NextResponse.json({ error: "Missing export parameters" }, { status: 400 }));
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
    return applySecurityHeaders(NextResponse.json({ error: "Session not found" }, { status: 404 }));
  }

  const canManage = attendanceSession.clubId
    ? await canManageClubAttendanceSession(attendanceSession.clubId, session.user.id, session.user.role)
    : canAccessFacultyTools(session.user.role) || attendanceSession.createdById === session.user.id;

  if (!canManage) {
    return applySecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }

  const rows = buildAttendanceRows(attendanceSession.records);

  if (format === "csv") {
    return applySecurityHeaders(
      new NextResponse(buildAttendanceCsv(attendanceSession.title, rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${attendanceSession.title.replace(/\s+/g, "-").toLowerCase()}-attendance.csv"`,
        },
      })
    );
  }

  return applySecurityHeaders(
    new NextResponse(buildAttendancePdf(attendanceSession.title, rows), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${attendanceSession.title.replace(/\s+/g, "-").toLowerCase()}-attendance.pdf"`,
      },
    })
  );
}
