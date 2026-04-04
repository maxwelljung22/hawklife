"use server";

import { revalidatePath } from "next/cache";
import type { AttendanceSessionType, AttendanceStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageClubAttendanceSession,
  createQrValue,
  getFlexBlockWindow,
  validateQrValue,
} from "@/lib/flex-attendance";
import { canAccessFacultyTools } from "@/lib/roles";

type CreateSessionInput = {
  title: string;
  type: AttendanceSessionType;
  clubId?: string;
  location: string;
  capacity: number;
};

async function requireUser() {
  const session = await auth();
  return session?.user ?? null;
}

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function joinFlexSession(sessionId: string) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  const { dayStart, dayEnd } = getFlexBlockWindow();

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      records: {
        select: { id: true, userId: true, status: true },
      },
      club: {
        select: { name: true },
      },
    },
  });

  if (!session || session.date < dayStart || session.date >= dayEnd || !session.isOpen) {
    return { error: "That session is not open right now." };
  }

  const attendeeCount = session.records.length;
  const existingRecord = await prisma.attendanceRecord.findFirst({
    where: {
      userId: user.id,
      session: {
        date: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    },
    include: {
      session: {
        select: { id: true, title: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  if (existingRecord?.sessionId === sessionId) {
    return { success: true, sessionId, status: existingRecord.status };
  }

  if (existingRecord && existingRecord.status !== "JOINED") {
    return { error: `You already checked into ${existingRecord.session.title}. You can't switch after scanning.` };
  }

  if (!existingRecord && attendeeCount >= session.capacity) {
    return { error: "This session is at capacity." };
  }

  if (existingRecord) {
    await prisma.attendanceRecord.delete({
      where: { id: existingRecord.id },
    });
  }

  await prisma.attendanceRecord.create({
    data: {
      sessionId,
      userId: user.id,
      status: "JOINED",
      present: false,
      joinedAt: new Date(),
      checkIn: null,
    },
  });

  revalidatePath("/flex");
  revalidatePath("/dashboard");

  return { success: true, sessionId, status: "JOINED" as const };
}

export async function createFlexSession(input: CreateSessionInput) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  if (!canAccessFacultyTools(user.role)) {
    return { error: "Only faculty can create flex sessions." };
  }

  const type = input.type;
  const location = input.location.trim();
  const capacity = Number.isFinite(input.capacity) ? Math.max(1, Math.min(500, Math.floor(input.capacity))) : 24;

  if (!location) return { error: "Add a location for the session." };

  const { date, startTime, endTime } = getFlexBlockWindow();

  let title = normalizeTitle(input.title);
  let hostName = user.name || "HawkLife Faculty";
  let clubId: string | null = null;

  if (type === "CLUB") {
    if (!input.clubId) return { error: "Choose a club for club sessions." };

    const club = await prisma.club.findUnique({
      where: { id: input.clubId },
      select: { id: true, name: true },
    });

    if (!club) return { error: "That club could not be found." };
    clubId = club.id;
    if (!title) title = club.name;
    hostName = club.name;

    const existingClubSession = await prisma.attendanceSession.findFirst({
      where: {
        clubId: club.id,
        date,
      },
      select: { id: true },
    });

    if (existingClubSession) {
      return { error: "A flex session for this club already exists today." };
    }
  }

  if (!title) return { error: "Add a session title." };

  const session = await prisma.attendanceSession.create({
    data: {
      title,
      type,
      clubId,
      createdById: user.id,
      hostName,
      location,
      capacity,
      date,
      startTime,
      endTime,
      isOpen: true,
    },
    include: {
      club: {
        select: { id: true, name: true, slug: true },
      },
      records: {
        select: { id: true },
      },
    },
  });

  revalidatePath("/flex");
  revalidatePath("/faculty/create-session");
  if (clubId) revalidatePath(`/club/${clubId}/attendance`);

  return { success: true, session };
}

export async function deleteFlexSession(sessionId: string) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      clubId: true,
      createdById: true,
      type: true,
    },
  });

  if (!session) return { error: "Session not found." };

  const canManage = session.clubId
    ? await canManageClubAttendanceSession(session.clubId, user.id, user.role)
    : canAccessFacultyTools(user.role) || session.createdById === user.id;

  if (!canManage) {
    return { error: "You don't have permission to remove that session." };
  }

  await prisma.attendanceSession.delete({
    where: { id: sessionId },
  });

  revalidatePath("/flex");
  revalidatePath("/faculty/create-session");
  if (session.clubId) revalidatePath(`/club/${session.clubId}/attendance`);

  return { success: true };
}

export async function ensureClubFlexSession(clubId: string) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  const canManage = await canManageClubAttendanceSession(clubId, user.id, user.role);
  if (!canManage) return { error: "You don't have permission to manage this club's attendance." };

  const { date, startTime, endTime } = getFlexBlockWindow();

  const existing = await prisma.attendanceSession.findFirst({
    where: { clubId, date },
    include: { records: { select: { id: true } }, club: { select: { id: true, name: true, slug: true } } },
  });

  if (existing) {
    return { success: true, session: existing };
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true, meetingRoom: true },
  });

  if (!club) return { error: "Club not found." };

  const session = await prisma.attendanceSession.create({
    data: {
      title: club.name,
      type: "CLUB",
      clubId,
      createdById: user.id,
      hostName: club.name,
      location: club.meetingRoom || "Club Room TBD",
      capacity: 30,
      date,
      startTime,
      endTime,
    },
    include: { records: { select: { id: true } }, club: { select: { id: true, name: true, slug: true } } },
  });

  revalidatePath("/flex");
  revalidatePath(`/club/${clubId}/attendance`);

  return { success: true, session };
}

export async function getFreshQrCodeValue(sessionId: string) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      qrCode: true,
      qrRefreshSeconds: true,
      clubId: true,
      createdById: true,
      title: true,
    },
  });

  if (!session) return { error: "Session not found." };

  const canManage = session.clubId
    ? await canManageClubAttendanceSession(session.clubId, user.id, user.role)
    : canAccessFacultyTools(user.role) || session.createdById === user.id;

  if (!canManage) {
    return { error: "You don't have permission to show this QR code." };
  }

  const qrValue = createQrValue(session);
  const expiresAt = Date.now() + session.qrRefreshSeconds * 1000;

  return {
    success: true,
    qrValue,
    expiresAt,
    title: session.title,
  };
}

export async function scanIntoFlexSession(qrValue: string) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = qrValue.trim();
  if (!parsed) return { error: "Scan a valid session QR code first." };

  const payload = (() => {
    try {
      const decoded = Buffer.from(parsed, "base64url").toString("utf8");
      return JSON.parse(decoded) as { sessionId?: string };
    } catch {
      return null;
    }
  })();

  if (!payload?.sessionId) {
    return { error: "That QR code couldn't be read." };
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id: payload.sessionId },
    select: {
      id: true,
      title: true,
      qrCode: true,
      qrRefreshSeconds: true,
      startTime: true,
      isOpen: true,
      clubId: true,
    },
  });

  if (!session || !session.isOpen) {
    return { error: "This flex session is no longer active." };
  }

  const validation = validateQrValue(parsed, session);
  if (!validation.valid) {
    return { error: validation.error };
  }

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId: user.id,
      },
    },
  });

  if (!record) {
    return { error: "Join this session before scanning in." };
  }

  if (record.status === "PRESENT" || record.status === "LATE") {
    return { success: true, status: record.status, title: session.title };
  }

  const { lateThreshold } = getFlexBlockWindow(session.startTime);
  const nextStatus = new Date() > lateThreshold ? "LATE" : "PRESENT";

  await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      status: nextStatus,
      present: true,
      checkIn: new Date(),
    },
  });

  revalidatePath("/flex");
  revalidatePath("/dashboard");

  return { success: true, status: nextStatus, title: session.title };
}

export async function markFlexAttendanceManually(
  sessionId: string,
  userId: string,
  status: AttendanceStatus
) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  if (!canAccessFacultyTools(user.role)) {
    return { error: "Only faculty or admins can manually mark attendance." };
  }

  if (status !== "PRESENT" && status !== "LATE") {
    return { error: "Choose either present or late." };
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      isOpen: true,
    },
  });

  if (!session) return { error: "Session not found." };

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!targetUser) return { error: "Student not found." };

  const now = new Date();

  const record = await prisma.attendanceRecord.upsert({
    where: {
      sessionId_userId: {
        sessionId,
        userId,
      },
    },
    update: {
      status,
      present: true,
      checkIn: now,
    },
    create: {
      sessionId,
      userId,
      status,
      present: true,
      joinedAt: now,
      checkIn: now,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  revalidatePath("/flex");
  revalidatePath("/dashboard");
  revalidatePath("/faculty/create-session");

  return {
    success: true,
    record,
    title: session.title,
    status,
    studentName: targetUser.name || targetUser.email || "Student",
  };
}
