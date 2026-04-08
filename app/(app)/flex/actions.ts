"use server";

import { revalidatePath } from "next/cache";
import type { AttendanceSessionType, AttendanceStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canParticipateInFlex,
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
  recurringWeekdays?: number[];
  recurrenceWeeks?: number;
};

const FACULTY_ALLOWED_MANUAL_STATUSES: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT"];
const ADMIN_ONLY_MANUAL_STATUSES: AttendanceStatus[] = ["ABSENT_EXCUSED", "LATE_EXCUSED"];

async function requireUser() {
  const session = await auth();
  return session?.user ?? null;
}

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildRecurringFlexDates(weekdays: number[], weeks: number) {
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const validWeekdays = Array.from(new Set(weekdays.filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)));
  const horizonDays = Math.max(1, Math.min(12, weeks)) * 7;

  if (validWeekdays.length === 0) {
    return [getFlexBlockWindow(dayStart).date];
  }

  const dates: Date[] = [];
  for (let offset = 0; offset < horizonDays; offset += 1) {
    const nextDate = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + offset);
    if (validWeekdays.includes(nextDate.getDay())) {
      dates.push(getFlexBlockWindow(nextDate).date);
    }
  }

  return dates.length > 0 ? dates : [getFlexBlockWindow(dayStart).date];
}

export async function joinFlexSession(sessionId: string) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  const { dayStart, dayEnd } = getFlexBlockWindow();

  let result:
    | { success: true; sessionId: string; status: AttendanceStatus }
    | { error: string };

  try {
    result = await prisma.$transaction(async (tx) => {
      const session = await tx.attendanceSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          title: true,
          date: true,
          isOpen: true,
          capacity: true,
        },
      });

      if (!session || session.date < dayStart || session.date >= dayEnd || !session.isOpen) {
        return { error: "That session is not open right now." } as const;
      }

      const existingRecord = await tx.attendanceRecord.findFirst({
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
        return { success: true, sessionId, status: existingRecord.status } as const;
      }

      if (existingRecord && existingRecord.status !== "JOINED" && existingRecord.status !== "ABSENT" && existingRecord.status !== "ABSENT_EXCUSED") {
        return {
          error: `You already checked into ${existingRecord.session.title}. You can't switch after scanning.`,
        } as const;
      }

      const attendeeCount = await tx.attendanceRecord.count({
        where: { sessionId },
      });

      if (!existingRecord && attendeeCount >= session.capacity) {
        return { error: "This session is at capacity." } as const;
      }

      if (existingRecord) {
        await tx.attendanceRecord.delete({
          where: { id: existingRecord.id },
        });
      }

      await tx.attendanceRecord.create({
        data: {
          sessionId,
          userId: user.id,
          status: "JOINED",
          present: false,
          joinedAt: new Date(),
          checkIn: null,
        },
      });

      return { success: true, sessionId, status: "JOINED" as const };
    }, {
      isolationLevel: "Serializable",
    });
  } catch (error: any) {
    if (error?.code === "P2034") {
      return { error: "A lot of students are joining right now. Please try again." };
    }

    throw error;
  }

  if ("error" in result) {
    return result;
  }

  revalidatePath("/flex");
  revalidatePath("/dashboard");

  return result;
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

  let title = normalizeTitle(input.title);
  let hostName = user.name || "HawkLife Faculty";
  let clubId: string | null = null;
  const targetDates = buildRecurringFlexDates(input.recurringWeekdays ?? [], input.recurrenceWeeks ?? 1);

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

    const existingClubSessions = await prisma.attendanceSession.findMany({
      where: {
        clubId: club.id,
        date: { in: targetDates },
      },
      select: { date: true },
    });

    const existingDateKeys = new Set(existingClubSessions.map((session) => session.date.toISOString()));
    const availableDates = targetDates.filter((targetDate) => !existingDateKeys.has(targetDate.toISOString()));
    if (availableDates.length === 0) {
      return { error: "A flex session for this club already exists for the selected flex dates." };
    }
    targetDates.length = 0;
    targetDates.push(...availableDates);
  }

  if (!title) return { error: "Add a session title." };

  const createdSessions = [];
  for (const targetDate of targetDates) {
    const { date, startTime, endTime } = getFlexBlockWindow(targetDate);
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
    createdSessions.push(session);
  }

  const session = createdSessions[0];

  revalidatePath("/flex");
  revalidatePath("/faculty/create-session");
  if (clubId) revalidatePath(`/club/${clubId}/attendance`);

  return { success: true, session, createdCount: createdSessions.length };
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

  if (["PRESENT", "LATE", "LATE_EXCUSED"].includes(record.status)) {
    return { success: true, status: record.status, title: session.title };
  }

  const { lateThreshold } = getFlexBlockWindow(session.startTime);
  const nextStatus: AttendanceStatus = new Date() > lateThreshold ? "LATE" : "PRESENT";

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
  userIds: string | string[],
  status: AttendanceStatus
) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  const isAdmin = user.role === "ADMIN";
  if (!canAccessFacultyTools(user.role)) {
    return { error: "Only faculty controls can manually mark attendance." };
  }

  if (!FACULTY_ALLOWED_MANUAL_STATUSES.includes(status) && !(isAdmin && ADMIN_ONLY_MANUAL_STATUSES.includes(status))) {
    return { error: "You don't have permission to use that attendance status." };
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      isOpen: true,
      clubId: true,
      createdById: true,
    },
  });

  if (!session) return { error: "Session not found." };

  const canManage = session.clubId
    ? await canManageClubAttendanceSession(session.clubId, user.id, user.role)
    : canAccessFacultyTools(user.role) || session.createdById === user.id;

  if (!canManage) {
    return { error: "You don't have permission to update attendance for that session." };
  }

  const targetUserIds = Array.isArray(userIds) ? Array.from(new Set(userIds)) : [userIds];
  if (targetUserIds.length === 0) return { error: "Select at least one student first." };

  const targetUsers = await prisma.user.findMany({
    where: { id: { in: targetUserIds } },
    select: { id: true, name: true, email: true, role: true, grade: true },
  });

  if (targetUsers.length === 0) return { error: "Student not found." };

  const now = new Date();
  const present = status === "PRESENT" || status === "LATE" || status === "LATE_EXCUSED";
  const records = [];
  for (const targetUser of targetUsers) {
    const record = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId: targetUser.id,
        },
      },
      update: {
        status,
        present,
        checkIn: present ? now : null,
      },
      create: {
        sessionId,
        userId: targetUser.id,
        status,
        present,
        joinedAt: now,
        checkIn: present ? now : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
          },
        },
      },
    });
    records.push(record);
  }

  revalidatePath("/flex");
  revalidatePath("/dashboard");
  revalidatePath("/faculty/create-session");

  return {
    success: true,
    record: records[0],
    records,
    title: session.title,
    status,
    studentName: targetUsers[0]?.name || targetUsers[0]?.email || "Student",
    updatedCount: records.length,
  };
}

export async function addStudentsToFlexSession(sessionId: string, userIds: string | string[]) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  if (!canAccessFacultyTools(user.role)) {
    return { error: "Only faculty and admins can pre-sign students into a flex session." };
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      clubId: true,
      createdById: true,
    },
  });

  if (!session) return { error: "Session not found." };

  const canManage = session.clubId
    ? await canManageClubAttendanceSession(session.clubId, user.id, user.role)
    : canAccessFacultyTools(user.role) || session.createdById === user.id;

  if (!canManage) {
    return { error: "You don't have permission to add students to that session." };
  }

  const targetUserIds = Array.isArray(userIds) ? Array.from(new Set(userIds)) : [userIds];
  if (targetUserIds.length === 0) return { error: "Select at least one student first." };

  const targetUsers = await prisma.user.findMany({
    where: {
      id: { in: targetUserIds },
    },
    select: { id: true, name: true, email: true, role: true, graduationYear: true },
  });

  const eligibleUsers = targetUsers.filter(canParticipateInFlex);

  if (eligibleUsers.length === 0) return { error: "No eligible flex participants were selected." };

  const now = new Date();
  const records = [];

  for (const targetUser of eligibleUsers) {
    const record = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId: targetUser.id,
        },
      },
      update: {},
      create: {
        sessionId,
        userId: targetUser.id,
        status: "JOINED",
        present: false,
        joinedAt: now,
        checkIn: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
          },
        },
      },
    });
    records.push(record);
  }

  revalidatePath("/flex");
  revalidatePath("/dashboard");
  revalidatePath("/faculty/create-session");

  return {
    success: true,
    record: records[0],
    records,
    title: session.title,
    studentName: eligibleUsers[0]?.name || eligibleUsers[0]?.email || "Student",
    updatedCount: records.length,
  };
}

export async function addStudentsToMultipleFlexSessions(sessionIds: string[], userIds: string | string[]) {
  const user = await requireUser();
  if (!user) return { error: "You need to sign in first." };
  if (!canAccessFacultyTools(user.role)) {
    return { error: "Only faculty and admins can require flex signups." };
  }

  const targetSessionIds = Array.from(new Set(sessionIds.filter(Boolean)));
  if (targetSessionIds.length === 0) {
    return { error: "Select at least one flex block date first." };
  }

  const targetUserIds = Array.isArray(userIds) ? Array.from(new Set(userIds)) : [userIds];
  if (targetUserIds.length === 0) {
    return { error: "Select at least one student first." };
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: { id: { in: targetSessionIds } },
    select: {
      id: true,
      title: true,
      clubId: true,
      createdById: true,
      date: true,
    },
    orderBy: [{ date: "asc" }, { title: "asc" }],
  });

  if (sessions.length === 0) {
    return { error: "No flex sessions were found for those dates." };
  }

  for (const session of sessions) {
    const canManage = session.clubId
      ? await canManageClubAttendanceSession(session.clubId, user.id, user.role)
      : canAccessFacultyTools(user.role) || session.createdById === user.id;

    if (!canManage) {
      return { error: `You don't have permission to require students for ${session.title}.` };
    }
  }

  const targetUsers = await prisma.user.findMany({
    where: {
      id: { in: targetUserIds },
    },
    select: { id: true, name: true, email: true, role: true, graduationYear: true },
  });

  const eligibleUsers = targetUsers.filter(canParticipateInFlex);
  if (eligibleUsers.length === 0) {
    return { error: "No eligible flex participants were selected." };
  }

  const now = new Date();
  let createdOrUpdatedCount = 0;

  for (const session of sessions) {
    for (const targetUser of eligibleUsers) {
      await prisma.attendanceRecord.upsert({
        where: {
          sessionId_userId: {
            sessionId: session.id,
            userId: targetUser.id,
          },
        },
        update: {},
        create: {
          sessionId: session.id,
          userId: targetUser.id,
          status: "JOINED",
          present: false,
          joinedAt: now,
          checkIn: null,
        },
      });
      createdOrUpdatedCount += 1;
    }
  }

  revalidatePath("/flex");
  revalidatePath("/dashboard");
  revalidatePath("/faculty/create-session");

  return {
    success: true,
    assignedSessionCount: sessions.length,
    assignedStudentCount: eligibleUsers.length,
    createdOrUpdatedCount,
    sessionTitle: sessions[0]?.title ?? "Flex block",
    studentName: eligibleUsers[0]?.name || eligibleUsers[0]?.email || "Student",
  };
}
