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

async function fetchFromAirtable(): Promise<NhsRecord[]> {
  if (!hasUsableAirtableKey(AIRTABLE_KEY)) {
    console.warn("[NHS] AIRTABLE_API_KEY not set — skipping fetch");
    return [];
  }

  const records: NhsRecord[] = [];
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
      const name  = String(f["Student Name"] ?? f["Name"] ?? "").trim();
      const email = f["Email"] ? String(f["Email"]).toLowerCase().trim() : null;
      const grade = f["Grade"] ? parseInt(String(f["Grade"]), 10) : null;
      const totalHours    = parseFloat(String(f["Total Hours"] ?? f["Hours"] ?? "0")) || 0;
      const requiredHours = grade ? (REQUIRED_HOURS[grade] ?? 0) : 0;

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
  let match: NhsRecord | undefined;
  if (!match && name) {
    const norm = name.toLowerCase().replace(/\s+/g, " ").trim();
    match = all.find((r) => {
      const rn = r.studentName.toLowerCase().replace(/\s+/g, " ").trim();
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
