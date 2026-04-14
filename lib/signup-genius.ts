import { remember } from "@/lib/server-cache";

const SIGNUP_GENIUS_API_URL = "https://www.signupgenius.com/sugboxapi.cfm";
const SERVICE_OPPORTUNITY_URL_ID = "10C0F44AAA62AA1FFC07-service";
const SIGNUP_GENIUS_TIMEOUT_MS = 8_000;
const SERVICE_EVENT_CACHE_TTL_MS = 60_000;
const SCHOOL_TIME_ZONE = "America/New_York";

type SignupGeniusEnvelope<T> = {
  MESSAGE?: string[];
  DATA?: T;
  SUCCESS?: boolean;
  CODE?: string;
};

type SignupGeniusBaseData = {
  id: number;
  urlid: string;
  title: string;
};

type SignupGeniusCalendarSlotItem = {
  item: string;
  qty: number;
  qtyTaken: number;
  comment?: string;
  itemDescription?: string;
  slotitemid: number;
  waitlist?: number;
};

type SignupGeniusCalendarSlot = {
  slotid: number;
  starttime: string;
  endtime: string;
  location: string;
  usetime: number;
  items: SignupGeniusCalendarSlotItem[];
};

type SignupGeniusCalendarMetadata = {
  calendarView?: {
    firstMonthWithSlots?: string;
    lastMonthWithSlots?: string;
  };
};

type SignupGeniusCalendarData = {
  slots?: Record<string, SignupGeniusCalendarSlot>;
  slotMetadata?: SignupGeniusCalendarMetadata;
};

export type ServiceOpportunityEvent = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  seatsTaken: number;
  seatsTotal: number;
  isFull: boolean;
  signupUrl: string;
};

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );

  return asUtc - date.getTime();
}

function parseSignupGeniusDateTime(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(normalized)) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const match = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!match) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  let timestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  for (let index = 0; index < 3; index += 1) {
    const offset = getTimeZoneOffsetMs(new Date(timestamp), SCHOOL_TIME_ZONE);
    const next = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ) - offset;

    if (next === timestamp) break;
    timestamp = next;
  }

  return new Date(timestamp);
}

function buildMonthKey(date: Date) {
  return `${date.getMonth() + 1}-${date.getFullYear()}`;
}

function parseMonthBoundary(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function enumerateMonthKeys(start: Date, end: Date) {
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const finish = new Date(end.getFullYear(), end.getMonth(), 1);
  const keys: string[] = [];

  while (cursor <= finish) {
    keys.push(buildMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
}

async function postSignupGenius<T>(go: string, body: Record<string, unknown>) {
  const response = await fetch(`${SIGNUP_GENIUS_API_URL}?go=${encodeURIComponent(go)}`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(SIGNUP_GENIUS_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "HawkLife Mission Ministry Feed",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`SignUpGenius request failed with ${response.status}`);
  }

  const payload = (await response.json()) as SignupGeniusEnvelope<T>;
  if (!payload.SUCCESS || !payload.DATA) {
    throw new Error(payload.MESSAGE?.[0] || "SignUpGenius returned an invalid response.");
  }

  return payload.DATA;
}

export async function fetchServiceOpportunityEvents() {
  return remember("signup-genius:service-events", SERVICE_EVENT_CACHE_TTL_MS, async () => {
    try {
      const base = await postSignupGenius<SignupGeniusBaseData>("s.getSignupInfo", {
        urlid: SERVICE_OPPORTUNITY_URL_ID,
        includeAdvanceDetails: true,
      });

      const initialMonthKey = buildMonthKey(new Date());
      const firstCalendar = await postSignupGenius<SignupGeniusCalendarData>("s.getSignupInfo", {
        urlid: base.urlid,
        listid: base.id,
        includeAdvanceDetails: true,
        forSignUpView: true,
        view: "calendar",
        calendarMonth: initialMonthKey,
      });

      const calendarView = firstCalendar.slotMetadata?.calendarView;
      const rangeStart = parseMonthBoundary(calendarView?.firstMonthWithSlots, new Date());
      const rangeEnd = parseMonthBoundary(calendarView?.lastMonthWithSlots, rangeStart);
      const monthKeys = Array.from(new Set([initialMonthKey, ...enumerateMonthKeys(rangeStart, rangeEnd)]));

      const calendars = await Promise.all(
        monthKeys.map((calendarMonth) =>
          postSignupGenius<SignupGeniusCalendarData>("s.getSignupInfo", {
            urlid: base.urlid,
            listid: base.id,
            includeAdvanceDetails: true,
            forSignUpView: true,
            view: "calendar",
            calendarMonth,
          }).catch(() => null)
        )
      );

      const eventMap = new Map<string, ServiceOpportunityEvent>();

      for (const calendar of calendars) {
        if (!calendar?.slots) continue;

        for (const slot of Object.values(calendar.slots)) {
          const item = slot.items?.[0];
          if (!item) continue;

          const startDate = parseSignupGeniusDateTime(slot.starttime);
          const endDate = parseSignupGeniusDateTime(slot.endtime);
          if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) continue;

          eventMap.set(String(slot.slotid), {
            id: String(slot.slotid),
            title: item.item || slot.location || base.title,
            location: slot.location || "Location TBD",
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            description: item.comment?.trim() || item.itemDescription?.trim() || "Open service opportunity.",
            seatsTaken: Number(item.qtyTaken || 0),
            seatsTotal: Number(item.qty || 0),
            isFull: Number(item.qtyTaken || 0) >= Number(item.qty || 0) && !item.waitlist,
            signupUrl: `https://www.signupgenius.com/go/${base.urlid}#/`,
          });
        }
      }

      return Array.from(eventMap.values()).sort((left, right) => left.startDate.localeCompare(right.startDate));
    } catch (error) {
      console.error("[MissionMinistry] Failed to load SignUpGenius service opportunities:", error);
      return [];
    }
  });
}
