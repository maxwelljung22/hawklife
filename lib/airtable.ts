/**
 * lib/airtable.ts
 * NHS Hours integration via Airtable API with PostgreSQL cache.
 * Cache TTL: 5 minutes. Matches students by email, then name fallback.
 */
import { cache } from "react";
import { prisma } from "./prisma";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appJJ7OQC18yfQF5V";
const AIRTABLE_TABLE   = process.env.AIRTABLE_TABLE   ?? "tblUPK4WTWSmKYouy";
const AIRTABLE_KEY     = process.env.AIRTABLE_API_KEY;
const CACHE_TTL_MS     = 5 * 60 * 1000; // 5 minutes

const REQUIRED_HOURS: Record<number, number> = {
  9:  0,
  10: 0,
  11: 15,
  12: 25,
};

const NAME_FIELD_CANDIDATES = ["Student Name", "Name", "Full Name"] as const;
const EMAIL_FIELD_CANDIDATES = ["Email", "Student Email", "School Email"] as const;
const GRADE_FIELD_CANDIDATES = ["Grade", "Class", "Year"] as const;
const HOURS_FIELD_CANDIDATES = ["Total Hours", "Hours", "Approved Hours"] as const;

export interface NhsRecord {
  id:            string;
  studentName:   string;
  studentEmail:  string | null;
  grade:         number | null;
  totalHours:    number;
  requiredHours: number;
  status:        "complete" | "on_track" | "behind" | "not_required";
  progressPct:   number;
  activities:    NhsActivity[];
  lastSyncAt:    Date;
}

export interface NhsActivity {
  name:     string;
  hours:    number;
  date:     string;
  category: string;
}

function computeStatus(total: number, required: number): NhsRecord["status"] {
  if (required === 0) return "not_required";
  if (total >= required) return "complete";
  if (total >= required * 0.6) return "on_track";
  return "behind";
}

function computeProgress(total: number, required: number): number {
  if (required === 0) return 0;
  return Math.min(100, Math.round((total / required) * 100));
}

function hasUsableAirtableKey(key?: string) {
  return Boolean(key && !key.includes("xxxxxxxx"));
}

function getFirstField(fields: Record<string, any>, keys: readonly string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return null;
}

function normalizeEmail(value: string | null | undefined) {
  return value ? value.toLowerCase().trim() : null;
}

function normalizeName(value: string | null | undefined) {
  return value
    ? value
        .toLowerCase()
        .replace(/[.'’,-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

function parseGradeValue(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getUserMatchMaps() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { not: null } },
        { name: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      grade: true,
      graduationYear: true,
    },
  });

  const byEmail = new Map<string, (typeof users)[number]>();
  const byName = new Map<string, (typeof users)[number][]>();

  for (const user of users) {
    const email = normalizeEmail(user.email);
    const name = normalizeName(user.name);

    if (email) byEmail.set(email, user);
    if (name) {
      const existing = byName.get(name) ?? [];
      existing.push(user);
      byName.set(name, existing);
    }
  }

  return { byEmail, byName };
}

function resolveMatchedUser(
  byEmail: Map<string, any>,
  byName: Map<string, any[]>,
  email: string | null,
  name: string,
  grade: number | null
) {
  if (email && byEmail.has(email)) {
    return byEmail.get(email) ?? null;
  }

  const normalizedName = normalizeName(name);
  if (!normalizedName) return null;

  const candidates = byName.get(normalizedName) ?? [];
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1 && grade !== null) {
    return candidates.find((candidate) => candidate.grade === grade) ?? candidates[0];
  }

  return null;
}

async function fetchFromAirtable(): Promise<NhsRecord[]> {
  if (!hasUsableAirtableKey(AIRTABLE_KEY)) {
    console.warn("[NHS] AIRTABLE_API_KEY not set — skipping fetch");
    return [];
  }

  const records: NhsRecord[] = [];
  const { byEmail, byName } = await getUserMatchMaps();
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        console.warn(`[NHS] Airtable auth failed (${res.status}). Falling back to cached NHS data.`);
        return [];
      }
      throw new Error(`Airtable error ${res.status}: ${text}`);
    }

    const data = await res.json();
    offset = data.offset;

    for (const rec of data.records ?? []) {
      const f = rec.fields as Record<string, any>;
      const airtableName = String(getFirstField(f, NAME_FIELD_CANDIDATES) ?? "").trim();
      const airtableEmail = normalizeEmail(getFirstField(f, EMAIL_FIELD_CANDIDATES));
      const airtableGrade = parseGradeValue(getFirstField(f, GRADE_FIELD_CANDIDATES));
      const totalHours = parseFloat(String(getFirstField(f, HOURS_FIELD_CANDIDATES) ?? "0")) || 0;
      const matchedUser = resolveMatchedUser(byEmail, byName, airtableEmail, airtableName, airtableGrade);
      const grade = airtableGrade ?? matchedUser?.grade ?? null;
      const requiredHours = grade ? (REQUIRED_HOURS[grade] ?? 0) : 0;
      const name = matchedUser?.name?.trim() || airtableName;
      const email = normalizeEmail(matchedUser?.email) ?? airtableEmail;

      let activities: NhsActivity[] = [];
      if (Array.isArray(f["Activities"])) {
        activities = f["Activities"].map((a: any) => ({
          name:     String(a["Activity Name"] ?? a["Name"] ?? "Activity"),
          hours:    parseFloat(String(a["Hours"] ?? "0")) || 0,
          date:     String(a["Date"] ?? ""),
          category: String(a["Category"] ?? "Service"),
        }));
      }

      if (name) {
        records.push({
          id:            rec.id,
          studentName:   name,
          studentEmail:  email,
          grade,
          totalHours,
          requiredHours,
          status:        computeStatus(totalHours, requiredHours),
          progressPct:   computeProgress(totalHours, requiredHours),
          activities,
          lastSyncAt:    new Date(),
        });
      }
    }
  } while (offset);

  return records;
}

async function isCacheStale(): Promise<boolean> {
  const latest = await prisma.nhsHoursCache.findFirst({
    orderBy: { lastSyncAt: "desc" },
    select:  { lastSyncAt: true },
  });
  if (!latest) return true;
  return Date.now() - latest.lastSyncAt.getTime() > CACHE_TTL_MS;
}

const getCachedNhsCacheRows = cache(async () =>
  prisma.nhsHoursCache.findMany({
    orderBy: { studentName: "asc" },
    select: {
      airtableId: true,
      studentName: true,
      studentEmail: true,
      grade: true,
      totalHours: true,
      requiredHours: true,
      activities: true,
      lastSyncAt: true,
    },
  })
);

async function writeCache(records: NhsRecord[]): Promise<void> {
  if (records.length === 0) return;
  await prisma.$transaction(
    records.map((r) =>
      prisma.nhsHoursCache.upsert({
        where:  { airtableId: r.id },
        update: {
          studentName:   r.studentName,
          studentEmail:  r.studentEmail,
          grade:         r.grade,
          totalHours:    r.totalHours,
          requiredHours: r.requiredHours,
          activities:    r.activities as any,
          lastSyncAt:    r.lastSyncAt,
          rawData:       r as any,
        },
        create: {
          airtableId:    r.id,
          studentName:   r.studentName,
          studentEmail:  r.studentEmail,
          grade:         r.grade,
          totalHours:    r.totalHours,
          requiredHours: r.requiredHours,
          activities:    r.activities as any,
          lastSyncAt:    r.lastSyncAt,
          rawData:       r as any,
        },
      })
    )
  );
}

function cacheToRecord(c: any): NhsRecord {
  return {
    id:            c.airtableId,
    studentName:   c.studentName,
    studentEmail:  c.studentEmail,
    grade:         c.grade,
    totalHours:    c.totalHours,
    requiredHours: c.requiredHours,
    status:        computeStatus(c.totalHours, c.requiredHours),
    progressPct:   computeProgress(c.totalHours, c.requiredHours),
    activities:    (c.activities as NhsActivity[]) ?? [],
    lastSyncAt:    c.lastSyncAt,
  };
}

export async function getAllNhsRecords(forceRefresh = false): Promise<NhsRecord[]> {
  if (forceRefresh || (await isCacheStale())) {
    try {
      const fresh = await fetchFromAirtable();
      if (fresh.length > 0) await writeCache(fresh);
      return fresh;
    } catch (err) {
      console.error("[NHS] Airtable fetch failed, using cache:", err);
    }
  }
  const cached = await getCachedNhsCacheRows();
  return cached.map(cacheToRecord);
}

export async function getNhsRecordForUser(email: string, name?: string | null): Promise<NhsRecord | null> {
  const emailLower = email.toLowerCase();
  const exactEmailMatch = await prisma.nhsHoursCache.findFirst({
    where: { studentEmail: { equals: emailLower, mode: "insensitive" } },
    select: {
      airtableId: true,
      studentName: true,
      studentEmail: true,
      grade: true,
      totalHours: true,
      requiredHours: true,
      activities: true,
      lastSyncAt: true,
    },
  });
  if (exactEmailMatch) return cacheToRecord(exactEmailMatch);

  const all = await getAllNhsRecords();
  const localPart = emailLower.split("@")[0];
  let match: NhsRecord | undefined = all.find((r) => {
    const recordEmail = normalizeEmail(r.studentEmail);
    return recordEmail ? recordEmail.split("@")[0] === localPart : false;
  });
  if (!match && name) {
    const norm = normalizeName(name);
    match = all.find((r) => {
      const rn = normalizeName(r.studentName);
      return rn === norm || rn.includes(norm) || norm.includes(rn);
    });
  }
  return match ?? null;
}

export async function syncNhsNow(): Promise<{ synced: number; error?: string }> {
  try {
    const records = await fetchFromAirtable();
    if (records.length === 0) {
      return {
        synced: 0,
        error: "Airtable credentials are missing or invalid. Update AIRTABLE_API_KEY to enable live sync.",
      };
    }
    await writeCache(records);
    return { synced: records.length };
  } catch (err: any) {
    return { synced: 0, error: err.message };
  }
}
