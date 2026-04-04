import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFacultyTools } from "@/lib/roles";
import { canManageClubAttendanceSession, createQrValue } from "@/lib/flex-attendance";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const attendanceSession = await prisma.attendanceSession.findUnique({
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

  if (!attendanceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const canManage = attendanceSession.clubId
    ? await canManageClubAttendanceSession(attendanceSession.clubId, session.user.id, session.user.role)
    : canAccessFacultyTools(session.user.role) || attendanceSession.createdById === session.user.id;

  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const qrValue = createQrValue(attendanceSession);

  return NextResponse.json({
    qrValue,
    expiresAt: Date.now() + attendanceSession.qrRefreshSeconds * 1000,
    title: attendanceSession.title,
    refreshSeconds: attendanceSession.qrRefreshSeconds,
  });
}
