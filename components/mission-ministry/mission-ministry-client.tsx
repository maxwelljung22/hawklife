"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Heart, MapPin, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  deleteMinistryProgram,
  toggleMinistryProgramRegistration,
  toggleMinistrySignup,
} from "@/app/(app)/mission-ministry/actions";
import type { ServiceOpportunityEvent } from "@/lib/signup-genius";
import { cn } from "@/lib/utils";

type ProgramType = "SERVICE_OPPORTUNITY" | "KAIROS" | "RETREAT";

type ProgramItem = {
  id: string;
  title: string;
  summary: string;
  description: string;
  type: ProgramType;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  capacity: number | null;
  isFeatured: boolean;
  registrationOpen: boolean;
  colorFrom: string;
  colorTo: string;
  imageUrl: string | null;
  createdByName: string | null;
  signupCount: number;
  signedUp: boolean;
  signups: {
    id: string;
    name: string | null;
    email: string | null;
    graduationYear: number | null;
  }[];
};

const TYPE_META: Record<ProgramType, { label: string; description: string; accent: string }> = {
  SERVICE_OPPORTUNITY: {
    label: "Service Opportunities",
    description: "Find service projects, local outreach, and ways to serve with intention.",
    accent: "from-[rgba(14,165,233,0.18)] to-[rgba(20,184,166,0.1)]",
  },
  KAIROS: {
    label: "Kairos",
    description: "Track Kairos offerings, key dates, and sign-up windows in one place.",
    accent: "from-[rgba(139,92,246,0.16)] to-[rgba(236,72,153,0.1)]",
  },
  RETREAT: {
    label: "Retreats",
    description: "See upcoming retreats, spiritual formation experiences, and registration info.",
    accent: "from-[rgba(245,158,11,0.18)] to-[rgba(239,68,68,0.1)]",
  },
};

const PROGRAM_TYPES = Object.keys(TYPE_META) as ProgramType[];
const SERVICE_SIGNUP_GENIUS_URL = "https://www.signupgenius.com/go/10C0F44AAA62AA1FFC07-service#/";
const PAGE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "service", label: "Service Opportunities" },
  { id: "kairos", label: "Kairos" },
  { id: "retreat", label: "Retreats" },
] as const;
type PageTab = (typeof PAGE_TABS)[number]["id"];

const RECURRING_SERVICE_OPPORTUNITIES = [
  {
    title: "PAR Recycle Works Collection Events",
    body:
      "PAR Recycle Works collects e-waste to be processed and recycled. Students are needed at collection drives throughout Philadelphia and the surrounding areas. Email Ms. Longto at klongto@sjprep.org for details or to sign up. These events are not typically staffed by Prep chaperones.",
  },
  {
    title: "Sharing Excess Events",
    body:
      "The Prep recently formed an on-campus chapter with Sharing Excess, a Philly nonprofit that rescues food before it is thrown away and distributes it to people who can use it. Beyond recurring after-school First Friday Pop Up Food distribution events on campus, there are several ways to partner with Sharing Excess.",
  },
  {
    title: "SSJ Neighborhood Center Food Pantry Days",
    body:
      "On the third Wednesday of every month, students assist the Sisters of St. Joseph as they prepare for their monthly food pantry day serving more than 200 families in the Cramer Park neighborhood of Camden. Service runs from the beginning of the school day until 2:00 PM. Students may miss class and volunteer once each school year if they are in good academic standing. During the summer months, service runs from 9:00 AM to 2:00 PM.",
  },
  {
    title: "Share Food Program - Nice Roots Farm",
    body:
      "Share Food Program leads the fight against food insecurity in the Philadelphia region through a broad network of community partners and school districts. Community Farming Days at Nice Roots Farm help students learn about growing food in an urban environment, make an impact with hands-on work, and meet others doing the same. No green thumb necessary.",
  },
  {
    title: "Gesu School Tutoring",
    body:
      "Every Tuesday and Thursday during Community Period. Please sign up through Flex Time Manager.",
  },
];

const PRE_APPROVED_SITES = [
  {
    region: "Philadelphia",
    sites: [
      "Sanctuary Farm",
      "Face to Face Germantown",
      "Share Food Programs",
      "Nationalities Service Center",
      "Caring for Friends",
      "Inglis House",
      "Northern Children's Services",
      "Philabundance",
      "MANNA",
      "Feast of Justice",
      "Blessed Sarnelli House",
      "Cradles to Crayons",
      "Friends of the Wissahickon",
    ],
  },
  {
    region: "Delaware County, PA",
    sites: [
      "Grands Stepping Up: Denis' Pantry",
      "Divine Providence Village",
      "Kids Against Hunger, Broomall, PA",
      "Media Food Bank",
    ],
  },
  {
    region: "Montgomery County, PA",
    sites: [
      "Martha's Choice Community Farm",
      "Martha's Choice Food Pantry",
      "Narberth Community Food Bank",
      "Mitzvah Circle",
      "The Shepherd's Shelf",
      "Manna on Main Street",
      "Cecil and Grace Bean's Soup Kitchen",
    ],
  },
  {
    region: "South Jersey",
    sites: ["Cathedral Kitchen", "South Jersey Food Bank", "Joseph's House", "SSJ Neighborhood Center"],
  },
  {
    region: "Chester County, PA",
    sites: ["Dorothy Day Center, West Chester, PA"],
  },
];

const SERVICE_HOUR_REQUIREMENTS = [
  "Freshmen are required to complete 10 hours.",
  "Sophomores are required to complete 10 hours.",
  "Juniors are required to complete 20 hours of service.",
  "Seniors are required to complete 40 hours of service.",
  "All students are required to have 80 hours completed at the time of graduation, with 75 hours for the Class of 2025 and Class of 2026.",
];

const GLASS_PANEL =
  "border border-[rgba(122,87,31,0.18)] bg-[linear-gradient(145deg,rgba(255,251,245,0.92),rgba(255,244,231,0.78))] shadow-[0_18px_50px_rgba(36,24,18,0.08)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(22,18,33,0.94),rgba(14,18,34,0.88))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]";
const INSET_PANEL =
  "border border-[rgba(122,87,31,0.14)] bg-[linear-gradient(145deg,rgba(255,255,255,0.78),rgba(248,236,220,0.68))] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(31,24,43,0.9),rgba(17,21,37,0.86))]";
const SOFT_BADGE =
  "border border-[rgba(255,255,255,0.45)] bg-[rgba(255,250,243,0.78)] text-slate-900 dark:border-white/10 dark:bg-[rgba(24,28,45,0.88)] dark:text-white";
const SCHOOL_TIME_ZONE = "America/New_York";

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", timeZone: SCHOOL_TIME_ZONE })} · ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: SCHOOL_TIME_ZONE })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: SCHOOL_TIME_ZONE })}`;
}

function formatEventCardDate(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDay = start.toLocaleDateString("en-US", { timeZone: SCHOOL_TIME_ZONE });
  const endDay = end.toLocaleDateString("en-US", { timeZone: SCHOOL_TIME_ZONE });
  const sameDay = startDay === endDay;

  if (sameDay) {
    return `${start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", timeZone: SCHOOL_TIME_ZONE })} · ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: SCHOOL_TIME_ZONE })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: SCHOOL_TIME_ZONE })}`;
  }

  return `${start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", timeZone: SCHOOL_TIME_ZONE })} - ${end.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", timeZone: SCHOOL_TIME_ZONE })}`;
}

export function MissionMinistryClient({
  programs,
  managerNames,
  canManage,
  serviceEvents,
}: {
  programs: ProgramItem[];
  managerNames: string[];
  canManage: boolean;
  serviceEvents: ServiceOpportunityEvent[];
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<PageTab>("overview");
  const serviceRailRef = useRef<HTMLDivElement | null>(null);

  const groupedPrograms = useMemo(
    () =>
      PROGRAM_TYPES.map((type) => ({
        type,
        meta: TYPE_META[type],
        items: programs.filter((program) => program.type === type),
      })),
    [programs]
  );
  const featuredPrograms = programs.filter((program) => program.isFeatured);
  const kairosPrograms = groupedPrograms.find((section) => section.type === "KAIROS")?.items ?? [];
  const retreatPrograms = groupedPrograms.find((section) => section.type === "RETREAT")?.items ?? [];

  const scrollServiceRail = (direction: "left" | "right") => {
    const rail = serviceRailRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction === "right" ? 340 : -340,
      behavior: "smooth",
    });
  };

  const handleSignup = (programId: string) => {
    startTransition(async () => {
      const result = await toggleMinistrySignup(programId);
      if ("error" in result) {
        toast({ title: "Couldn't update signup", description: result.error, variant: "destructive" });
        return;
      }

      toast({
        title: result.action === "added" ? "You’re signed up" : "Signup removed",
        description: result.title,
      });
    });
  };

  const handleToggleOpen = (programId: string, nextOpen: boolean) => {
    startTransition(async () => {
      const result = await toggleMinistryProgramRegistration(programId, nextOpen);
      if ("error" in result) {
        toast({ title: "Couldn't update registration", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: nextOpen ? "Registration reopened" : "Registration closed" });
    });
  };

  const handleDelete = (programId: string) => {
    startTransition(async () => {
      const result = await deleteMinistryProgram(programId);
      if ("error" in result) {
        toast({ title: "Couldn't delete program", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Program removed" });
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[38px] border border-[rgba(122,87,31,0.2)] bg-[linear-gradient(135deg,rgba(123,31,43,0.92),rgba(142,83,24,0.88),rgba(34,57,102,0.86))] p-6 shadow-[0_30px_90px_rgba(25,17,12,0.18)] sm:p-8 lg:p-10 dark:border-[rgba(240,214,158,0.12)] dark:bg-[linear-gradient(135deg,rgba(48,16,28,0.98),rgba(79,43,17,0.96),rgba(17,27,58,0.96))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,243,214,0.34),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%),linear-gradient(90deg,transparent_0%,rgba(255,220,160,0.08)_48%,transparent_100%)]" />
        <div className="absolute inset-y-0 left-[11%] w-px bg-[rgba(255,224,173,0.28)]" />
        <div className="absolute inset-y-0 right-[14%] w-px bg-[rgba(255,224,173,0.18)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              {["Faith", "Service", "Reflection"].map((item) => (
                <span key={item} className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", SOFT_BADGE)}>
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">St. Joseph&apos;s Prep</p>
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,7vw,4.8rem)] font-semibold tracking-[-0.07em] text-white">
              Mission & Ministry
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/82">
              A warmer, more sacred home for service opportunities, Kairos updates, and retreat sign-ups across the Prep.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {PAGE_TABS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    tab === item.id
                      ? "border-transparent bg-[rgba(255,248,236,0.95)] text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.18)] dark:bg-[rgba(250,226,176,0.92)]"
                      : "border-white/25 bg-white/10 text-white/78 hover:bg-white/18 hover:text-white"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {managerNames.length > 0 ? (
                managerNames.map((name) => (
                  <span key={name} className={cn("rounded-full px-3 py-1.5 text-[12px] font-medium", SOFT_BADGE)}>
                    {name}
                  </span>
                ))
              ) : (
                <span className={cn("rounded-full px-3 py-1.5 text-[12px] font-medium", SOFT_BADGE)}>
                  Ministry team updates coming soon
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Featured", value: featuredPrograms.length },
              { label: "Open sign-ups", value: programs.filter((program) => program.registrationOpen).length },
              { label: "Total programs", value: programs.length },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/12 bg-[rgba(16,21,38,0.28)] px-4 py-4 text-white backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/64">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {canManage ? (
        <div className="flex justify-end">
          <Link
            href="/faculty/mission-ministry"
            className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Open staff publishing tools
          </Link>
        </div>
      ) : null}

      {tab === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Heart,
            title: "Rooted in service",
            body: "Keep students connected to meaningful service and ministry opportunities with one calm, consistent home.",
          },
          {
            icon: CalendarDays,
            title: "Kairos & retreat planning",
            body: "Make big milestones easier to discover, easier to register for, and easier to track.",
          },
          {
            icon: Users,
            title: "Clear team presence",
            body: "Let students see who leads Mission & Ministry and where to go when they need the next step.",
          },
        ].map((item) => (
          <div key={item.title} className={cn("rounded-[28px] p-5", GLASS_PANEL)}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgba(145,41,54,0.18),rgba(209,154,76,0.24))] text-[hsl(var(--primary))] dark:text-[#f6d08a]">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.05em] text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/72 dark:text-white/70">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className={cn("rounded-[32px] p-6", GLASS_PANEL)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50 dark:text-white/50">Featured right now</p>
          <div className="mt-5 grid gap-4">
            {(featuredPrograms.length > 0 ? featuredPrograms : serviceEvents.slice(0, 2).map((event) => ({
              id: event.id,
              title: event.title,
              summary: event.description,
              description: event.description,
              type: "SERVICE_OPPORTUNITY" as ProgramType,
              location: event.location,
              startDate: event.startDate,
              endDate: event.endDate,
              registrationDeadline: null,
              capacity: event.seatsTotal,
              isFeatured: true,
              registrationOpen: !event.isFull,
              colorFrom: "#8B1A1A",
              colorTo: "#0EA5E9",
              imageUrl: null,
              createdByName: "Mission & Ministry",
              signupCount: event.seatsTaken,
              signedUp: false,
              signups: [],
            }))).slice(0, 2).map((program, index) => {
                const capacityReached = program.capacity !== null && program.signupCount >= program.capacity && !program.signedUp;
                return (
                  <motion.article
                    key={program.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                    className="overflow-hidden rounded-[30px] border border-border bg-card shadow-card"
                  >
                    <div className={cn("p-5 sm:p-6", "bg-gradient-to-br", TYPE_META[program.type].accent)} style={{ backgroundImage: `linear-gradient(135deg, ${program.colorFrom}20, ${program.colorTo}18)` }}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            {program.isFeatured ? (
                              <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", SOFT_BADGE)}>
                                Featured
                              </span>
                            ) : null}
                            <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", SOFT_BADGE)}>
                              {TYPE_META[program.type].label}
                            </span>
                          </div>
                          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-foreground">{program.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-foreground/72 dark:text-white/72">{program.summary}</p>
                        </div>
                        <div className={cn("rounded-[22px] px-4 py-3 text-sm text-foreground shadow-sm", INSET_PANEL)}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/52 dark:text-white/54">Sign-ups</p>
                          <p className="mt-1 text-xl font-semibold">{program.signupCount}{program.capacity ? `/${program.capacity}` : ""}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5 sm:p-6">
                      <p className="text-sm leading-7 text-foreground/74 dark:text-white/70">{program.description}</p>

                      <div className="grid gap-3 text-sm text-foreground/70 dark:text-white/68 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {formatDateRange(program.startDate, program.endDate)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {program.location}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[12px] text-foreground/70 dark:text-white/68">
                        <span className={cn("rounded-full px-3 py-1.5", INSET_PANEL)}>
                          {program.registrationOpen ? "Registration open" : "Registration closed"}
                        </span>
                        {program.registrationDeadline ? (
                          <span className={cn("rounded-full px-3 py-1.5", INSET_PANEL)}>
                            Deadline {new Date(program.registrationDeadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        ) : null}
                        <span className={cn("rounded-full px-3 py-1.5", INSET_PANEL)}>
                          Posted by {program.createdByName || "Mission & Ministry"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          size="lg"
                          onClick={() => handleSignup(program.id)}
                          disabled={isPending || (!program.registrationOpen && !program.signedUp) || capacityReached}
                          className={cn(
                            "w-full sm:w-auto",
                            program.signedUp ? "" : ""
                          )}
                        >
                          {program.signedUp ? "Cancel sign-up" : capacityReached ? "Program full" : "Sign up"}
                        </Button>

                        {canManage ? (
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" size="sm" onClick={() => handleToggleOpen(program.id, !program.registrationOpen)} disabled={isPending}>
                              {program.registrationOpen ? "Close registration" : "Reopen registration"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(program.id)} disabled={isPending}>
                              Delete
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {canManage && program.signups.length > 0 ? (
                        <div className={cn("rounded-[24px] p-4", INSET_PANEL)}>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground/52 dark:text-white/52">Student roster</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {program.signups.map((signup) => (
                              <span key={signup.id} className={cn("rounded-full px-3 py-1.5 text-[12px]", INSET_PANEL)}>
                                {signup.name || signup.email || "Student"}{signup.graduationYear ? ` · ${signup.graduationYear}` : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
                );
              })}
          </div>
        </section>

        <section className={cn("rounded-[32px] p-6", GLASS_PANEL)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50 dark:text-white/50">What students can do here</p>
          <div className="mt-4 space-y-4">
            {[
              "Browse live service opportunities without leaving HawkLife.",
              "Track Kairos offerings and sign up windows in one place.",
              "See upcoming retreats with cleaner details and registration status.",
              "Open the full Mission & Ministry signup tools from the faculty dashboard if you manage the department.",
            ].map((item) => (
              <div key={item} className={cn("rounded-[22px] px-4 py-3 text-sm leading-7 text-foreground/74 dark:text-white/72", INSET_PANEL)}>
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
        </>
      ) : null}

      {tab === "service" ? (
        <div className="space-y-4">
          <section className={cn("overflow-hidden rounded-[34px] p-6 sm:p-7", GLASS_PANEL)}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50 dark:text-white/50">Live Service Calendar</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-foreground">Upcoming service opportunities pulled from SignUpGenius</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground/72 dark:text-white/72">
                  A calmer, interactive view of what is coming up next. Swipe, drag, or use the arrows to move through the opportunities at your own pace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollServiceRail("left")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/80 text-foreground transition-colors hover:bg-background"
                  aria-label="Scroll service opportunities left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollServiceRail("right")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/80 text-foreground transition-colors hover:bg-background"
                  aria-label="Scroll service opportunities right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <Link
                  href={SERVICE_SIGNUP_GENIUS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Open live signup
                </Link>
              </div>
            </div>

            <div
              ref={serviceRailRef}
              className="mt-6 overflow-x-auto pb-3 [scrollbar-width:thin] snap-x snap-mandatory"
            >
              {serviceEvents.length > 0 ? (
                <motion.div
                  className="flex w-max gap-4 pr-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  {serviceEvents.map((event) => (
                    <article
                      key={event.id}
                      className="w-[min(84vw,360px)] snap-start rounded-[30px] border border-[rgba(122,87,31,0.16)] bg-[linear-gradient(145deg,rgba(255,245,229,0.95),rgba(249,227,192,0.72),rgba(218,229,255,0.66))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(43,23,31,0.96),rgba(59,37,21,0.92),rgba(20,30,55,0.92))]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/52 dark:text-white/54">
                            {event.isFull ? "Currently full" : "Open opportunity"}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-foreground">{event.title}</h3>
                        </div>
                        <div className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", SOFT_BADGE)}>
                          {event.seatsTaken}/{event.seatsTotal || "?"}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-foreground/72 dark:text-white/72">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{formatEventCardDate(event.startDate, event.endDate)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{event.location}</span>
                        </div>
                      </div>

                      <p className="mt-4 min-h-[96px] text-sm leading-6 text-foreground/74 dark:text-white/74">{event.description}</p>

                      <Link
                        href={event.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center justify-center rounded-2xl border border-[rgba(122,87,31,0.16)] bg-[rgba(255,250,243,0.82)] px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-white dark:border-white/10 dark:bg-[rgba(22,28,45,0.9)] dark:text-white dark:hover:bg-[rgba(30,36,58,0.96)]"
                      >
                        Sign up in SignUpGenius
                      </Link>
                    </article>
                  ))}
                </motion.div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                  The live service feed is temporarily unavailable. You can still use the SignUpGenius button above.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
            <section className="surface-card rounded-[32px] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recurring Opportunities</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Service opportunities that come around often</h3>
                </div>
                <Link
                  href={SERVICE_SIGNUP_GENIUS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  Open SignUpGenius
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {RECURRING_SERVICE_OPPORTUNITIES.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.04 }}
                    className={cn("rounded-[24px] p-4", INSET_PANEL)}
                  >
                    <h4 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-foreground">{item.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-foreground/74 dark:text-white/72">{item.body}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            <div className="space-y-4">
              <section className={cn("rounded-[32px] p-6", GLASS_PANEL)}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50 dark:text-white/50">Pre-Approved Sites</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">A strong starting point for service</h3>
                <p className="mt-2 text-sm leading-7 text-foreground/72 dark:text-white/72">
                  Hours at these sites are pre-approved for service hours. Please contact Ms. Longto for more information about any of these locations. This list is not exhaustive, but it is a strong place to begin.
                </p>
                <div className="mt-5 grid gap-4">
                  {PRE_APPROVED_SITES.map((group) => (
                    <div key={group.region} className={cn("rounded-[24px] p-4", INSET_PANEL)}>
                      <p className="text-sm font-semibold text-foreground">{group.region}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.sites.map((site) => (
                          <span key={site} className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] text-foreground">
                            {site}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={cn("rounded-[32px] p-6", GLASS_PANEL)}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50 dark:text-white/50">Service Hour Guidelines</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Required, Ignatian, and tracked clearly</h3>
                <p className="mt-3 text-sm leading-7 text-foreground/72 dark:text-white/72">
                  The Mission & Ministry Ignatian Service Program is rooted in the belief of St. Ignatius that love is shown in deeds rather than in words. Students are invited to become men for and with others by stepping beyond their usual experience and serving people who are materially poor, marginalized, disadvantaged, or living with disability.
                </p>
                <div className={cn("mt-4 rounded-[24px] p-4", INSET_PANEL)}>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground/52 dark:text-white/52">Service Hour Requirement</p>
                  <div className="mt-3 space-y-2">
                    {SERVICE_HOUR_REQUIREMENTS.map((item) => (
                      <p key={item} className="text-sm text-foreground">{item}</p>
                    ))}
                  </div>
                </div>
                <div className={cn("mt-4 rounded-[24px] p-4", INSET_PANEL)}>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground/52 dark:text-white/52">MobileServe</p>
                  <p className="mt-2 text-sm leading-7 text-foreground/72 dark:text-white/72">
                    Service hours are tracked by the Office of Mission & Ministry through MobileServe. Students should download the app through the App Store or Google Play Store, or use the web version at{" "}
                    <a
                      href="https://mobileserve.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[hsl(var(--primary))]"
                    >
                      mobileserve.com
                    </a>
                    .
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "kairos" ? (
        <section className="space-y-4">
          <div className="px-1">
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">Kairos</h2>
            <p className="mt-1 text-sm text-muted-foreground">{TYPE_META.KAIROS.description}</p>
          </div>
          {kairosPrograms.length === 0 ? (
            <div className="surface-card rounded-[28px] border-dashed p-8 text-center">
              <p className="text-base font-semibold text-foreground">Nothing published here yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Mission & Ministry will post the next Kairos update here.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {kairosPrograms.map((program, index) => {
                const capacityReached = program.capacity !== null && program.signupCount >= program.capacity && !program.signedUp;
                return (
                  <motion.article
                    key={program.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                    className="overflow-hidden rounded-[30px] border border-border bg-card shadow-card"
                  >
                    <div className={cn("p-5 sm:p-6", "bg-gradient-to-br", TYPE_META.KAIROS.accent)} style={{ backgroundImage: `linear-gradient(135deg, ${program.colorFrom}20, ${program.colorTo}18)` }}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">{program.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-foreground/72 dark:text-white/72">{program.summary}</p>
                        </div>
                        <div className={cn("rounded-[22px] px-4 py-3 text-sm text-foreground shadow-sm", INSET_PANEL)}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/52 dark:text-white/54">Sign-ups</p>
                          <p className="mt-1 text-xl font-semibold">{program.signupCount}{program.capacity ? `/${program.capacity}` : ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 p-5 sm:p-6">
                      <p className="text-sm leading-7 text-foreground/72 dark:text-white/72">{program.description}</p>
                      <div className="grid gap-3 text-sm text-foreground/70 dark:text-white/68 sm:grid-cols-2">
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDateRange(program.startDate, program.endDate)}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{program.location}</div>
                      </div>
                      <Button size="lg" onClick={() => handleSignup(program.id)} disabled={isPending || (!program.registrationOpen && !program.signedUp) || capacityReached}>
                        {program.signedUp ? "Cancel sign-up" : capacityReached ? "Program full" : "Sign up"}
                      </Button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {tab === "retreat" ? (
        <section className="space-y-4">
          <div className="px-1">
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">Retreats</h2>
            <p className="mt-1 text-sm text-muted-foreground">{TYPE_META.RETREAT.description}</p>
          </div>
          {retreatPrograms.length === 0 ? (
            <div className="surface-card rounded-[28px] border-dashed p-8 text-center">
              <p className="text-base font-semibold text-foreground">Nothing published here yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Mission & Ministry will post the next retreat here.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {retreatPrograms.map((program, index) => {
                const capacityReached = program.capacity !== null && program.signupCount >= program.capacity && !program.signedUp;
                return (
                  <motion.article
                    key={program.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                    className="overflow-hidden rounded-[30px] border border-border bg-card shadow-card"
                  >
                    <div className={cn("p-5 sm:p-6", "bg-gradient-to-br", TYPE_META.RETREAT.accent)} style={{ backgroundImage: `linear-gradient(135deg, ${program.colorFrom}20, ${program.colorTo}18)` }}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">{program.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-foreground/72 dark:text-white/72">{program.summary}</p>
                        </div>
                        <div className={cn("rounded-[22px] px-4 py-3 text-sm text-foreground shadow-sm", INSET_PANEL)}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/52 dark:text-white/54">Sign-ups</p>
                          <p className="mt-1 text-xl font-semibold">{program.signupCount}{program.capacity ? `/${program.capacity}` : ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 p-5 sm:p-6">
                      <p className="text-sm leading-7 text-foreground/72 dark:text-white/72">{program.description}</p>
                      <div className="grid gap-3 text-sm text-foreground/70 dark:text-white/68 sm:grid-cols-2">
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDateRange(program.startDate, program.endDate)}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{program.location}</div>
                      </div>
                      <Button size="lg" onClick={() => handleSignup(program.id)} disabled={isPending || (!program.registrationOpen && !program.signedUp) || capacityReached}>
                        {program.signedUp ? "Cancel sign-up" : capacityReached ? "Program full" : "Sign up"}
                      </Button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
