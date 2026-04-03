import type { ApplicationStatus, CharterApplication, ClubCategory } from "@prisma/client";

export type CharterRoleEntry = {
  title: string;
  person: string;
};

export type CharterFormValues = {
  id?: string;
  clubName: string;
  category: ClubCategory;
  missionStatement: string;
  founderName: string;
  coFounders: string[];
  leadershipRoles: CharterRoleEntry[];
  whyExist: string;
  uniqueValue: string;
  plannedEvents: string[];
  meetingFrequency: string;
  expectedMemberCount: string;
  advisorName: string;
  advisorEmail: string;
};

export const CHARTER_STEPS = [
  { id: "basics", title: "Club Basics", description: "Shape the core identity of the club." },
  { id: "leadership", title: "Leadership", description: "Show who will lead and how responsibilities are shared." },
  { id: "viability", title: "Plan & Viability", description: "Explain why the club matters and how it will stay active." },
  { id: "logistics", title: "Logistics", description: "Clarify cadence, scale, and advisor support." },
  { id: "review", title: "Review", description: "Check everything before sending it for review." },
] as const;

export const CHARTER_CATEGORY_OPTIONS: { value: ClubCategory; label: string }[] = [
  { value: "STEM", label: "STEM" },
  { value: "HUMANITIES", label: "Humanities" },
  { value: "ARTS", label: "Arts" },
  { value: "BUSINESS", label: "Business" },
  { value: "SERVICE", label: "Service" },
  { value: "SPORTS", label: "Sports" },
  { value: "FAITH", label: "Faith" },
  { value: "OTHER", label: "Other" },
];

export const CHARTER_MEETING_OPTIONS = [
  "Weekly",
  "Every other week",
  "Twice a month",
  "Monthly",
  "Project based",
] as const;

export const EMPTY_CHARTER_FORM: CharterFormValues = {
  clubName: "",
  category: "STEM",
  missionStatement: "",
  founderName: "",
  coFounders: [""],
  leadershipRoles: [{ title: "Founder", person: "" }],
  whyExist: "",
  uniqueValue: "",
  plannedEvents: [""],
  meetingFrequency: CHARTER_MEETING_OPTIONS[0],
  expectedMemberCount: "",
  advisorName: "",
  advisorEmail: "",
};

export const CHARTER_STATUS_STYLES: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/20 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/20",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20",
  ACCEPTED: "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20",
  REJECTED: "bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/20 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20",
  WAITLISTED: "bg-violet-500/10 text-violet-700 ring-1 ring-inset ring-violet-500/20 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/20",
};

export function getCharterStatusLabel(status: ApplicationStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function calculateCharterStrength(values: CharterFormValues) {
  const checks = [
    values.clubName.trim().length >= 3,
    Boolean(values.category),
    values.missionStatement.trim().length >= 40,
    values.founderName.trim().length >= 2,
    values.coFounders.filter(Boolean).length >= 1,
    values.leadershipRoles.filter((entry) => entry.title.trim() && entry.person.trim()).length >= 2,
    values.whyExist.trim().length >= 80,
    values.uniqueValue.trim().length >= 60,
    values.plannedEvents.filter(Boolean).length >= 2,
    values.meetingFrequency.trim().length > 0,
    Number(values.expectedMemberCount) >= 5,
    values.advisorName.trim().length === 0 || values.advisorName.trim().length >= 3,
    values.advisorEmail.trim().length === 0 || values.advisorEmail.includes("@"),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function getCharterStrengthLabel(score: number) {
  if (score >= 90) return "Launch ready";
  if (score >= 70) return "Strong draft";
  if (score >= 45) return "In progress";
  return "Needs detail";
}

export function normalizeStringArray(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

export function normalizeRoleEntries(values: CharterRoleEntry[]) {
  return values
    .map((value) => ({ title: value.title.trim(), person: value.person.trim() }))
    .filter((value) => value.title && value.person);
}

export function serializeCharterApplication(application: CharterApplication): CharterFormValues {
  const coFounders = parseStringArray(application.coFounders);
  const leadershipRoles = parseRoleEntries(application.leadershipRoles);
  const plannedEvents = parseStringArray(application.plannedEvents);

  return {
    id: application.id,
    clubName: application.clubName,
    category: application.category,
    missionStatement: application.missionStatement,
    founderName: application.founderName,
    coFounders: coFounders.length ? coFounders : [""],
    leadershipRoles: leadershipRoles.length ? leadershipRoles : [{ title: "Founder", person: application.founderName }],
    whyExist: application.whyExist,
    uniqueValue: application.uniqueValue,
    plannedEvents: plannedEvents.length ? plannedEvents : [""],
    meetingFrequency: application.meetingFrequency,
    expectedMemberCount: String(application.expectedMemberCount),
    advisorName: application.advisorName ?? "",
    advisorEmail: application.advisorEmail ?? "",
  };
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseRoleEntries(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is CharterRoleEntry =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { title?: unknown }).title === "string" &&
      typeof (item as { person?: unknown }).person === "string"
  );
}
