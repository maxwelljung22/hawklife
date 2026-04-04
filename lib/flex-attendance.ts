import { createHmac, timingSafeEqual } from "crypto";
import type { AttendanceSession, AttendanceSessionType, AttendanceStatus, MembershipRole, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessFacultyTools } from "@/lib/roles";

const FLEX_START_HOUR = 14;
const FLEX_START_MINUTE = 5;
const FLEX_END_HOUR = 14;
const FLEX_END_MINUTE = 40;
const LATE_THRESHOLD_MINUTES = 8;

export const FLEX_BLOCK_LABEL = "2:05–2:40 PM";

type QrPayload = {
  sessionId: string;
  timestamp: number;
  validationToken: string;
};

export function getFlexBlockWindow(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  const date = new Date(year, month, day);
  const startTime = new Date(year, month, day, FLEX_START_HOUR, FLEX_START_MINUTE, 0, 0);
  const endTime = new Date(year, month, day, FLEX_END_HOUR, FLEX_END_MINUTE, 0, 0);
  const lateThreshold = new Date(startTime.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);
  const nextDay = new Date(year, month, day + 1);

  return {
    date,
    startTime,
    endTime,
    lateThreshold,
    dayStart: date,
    dayEnd: nextDay,
  };
}

export function getSessionTypeLabel(type: AttendanceSessionType) {
  switch (type) {
    case "CLUB":
      return "Club";
    case "STUDY_HALL":
      return "Study Hall";
    case "EVENT":
      return "Event";
    default:
      return "Session";
  }
}

export function getAttendanceStatusLabel(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "LATE":
      return "Late";
    case "JOINED":
    default:
      return "Joined";
  }
}

export function getSessionAccent(type: AttendanceSessionType) {
  switch (type) {
    case "CLUB":
      return "from-[rgba(139,26,26,0.18)] to-[rgba(230,82,92,0.10)]";
    case "STUDY_HALL":
      return "from-[rgba(52,104,169,0.16)] to-[rgba(125,170,242,0.10)]";
    case "EVENT":
      return "from-[rgba(184,146,64,0.18)] to-[rgba(255,201,107,0.10)]";
    default:
      return "from-[rgba(139,26,26,0.18)] to-[rgba(230,82,92,0.10)]";
  }
}

function getSigningKey() {
  return process.env.NEXTAUTH_SECRET || "hawklife-flex-secret";
}

function signSessionPayload(sessionId: string, timestamp: number, qrCode: string) {
  return createHmac("sha256", getSigningKey())
    .update(`${sessionId}.${timestamp}.${qrCode}`)
    .digest("base64url");
}

export function createQrValue(session: Pick<AttendanceSession, "id" | "qrCode" | "qrRefreshSeconds">, now = Date.now()) {
  const payload: QrPayload = {
    sessionId: session.id,
    timestamp: now,
    validationToken: signSessionPayload(session.id, now, session.qrCode),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function parseQrValue(value: string): QrPayload | null {
  try {
    const raw = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as QrPayload;

    if (
      !parsed ||
      typeof parsed.sessionId !== "string" ||
      typeof parsed.timestamp !== "number" ||
      typeof parsed.validationToken !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function validateQrValue(
  value: string,
  session: Pick<AttendanceSession, "id" | "qrCode" | "qrRefreshSeconds">
) {
  const payload = parseQrValue(value);
  if (!payload || payload.sessionId !== session.id) {
    return { valid: false as const, error: "That QR code is not valid for this session." };
  }

  const expected = signSessionPayload(session.id, payload.timestamp, session.qrCode);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(payload.validationToken);

  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return { valid: false as const, error: "That QR code signature is invalid." };
  }

  const expiresAt = payload.timestamp + session.qrRefreshSeconds * 1000;
  if (Date.now() > expiresAt + 5000) {
    return { valid: false as const, error: "That QR code has expired. Please refresh and try again." };
  }

  return { valid: true as const, payload, expiresAt };
}

export async function canManageClubAttendanceSession(
  clubId: string,
  userId: string,
  userRole?: UserRole | null
) {
  if (canAccessFacultyTools(userRole)) return true;

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId, clubId } },
    select: { role: true, status: true },
  });

  if (!membership || membership.status !== "ACTIVE") return false;

  return membership.role === "PRESIDENT" || membership.role === "OFFICER" || membership.role === "FACULTY_ADVISOR";
}

export async function getUserClubRole(clubId: string, userId: string): Promise<MembershipRole | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId, clubId } },
    select: { role: true, status: true },
  });

  if (!membership || membership.status !== "ACTIVE") return null;
  return membership.role;
}
