"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, CalendarDays, Compass, Megaphone, Sparkles, Vote } from "lucide-react";
import { formatRelativeTime, cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { NhsRecord } from "@/lib/airtable";
import { canAccessFacultyTools } from "@/lib/roles";
import type { UserRole } from "@prisma/client";

interface Props {
  user:            { name?: string | null; email?: string | null; image?: string | null; role: UserRole };
  membershipCount: number;
  upcomingEvents:  any[];
  recentPosts:     any[];
  myMemberships:   any[];
  nhsRecord:       NhsRecord | null;
  unreadNotifs:    number;
}

const EASE = [0.4, 0, 0.2, 1] as const;
const fu   = (delay = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE, delay } } });

const STAT_COLORS: Record<string, string> = {
  crimson: "rgba(139,26,26,.08)",
  navy:    "rgba(14,27,44,.07)",
  gold:    "rgba(154,124,46,.10)",
  green:   "rgba(46,125,82,.08)",
};

export function DashboardClient({ user, membershipCount, upcomingEvents, recentPosts, myMemberships, nhsRecord, unreadNotifs }: Props) {
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] ?? "there";
  const quickActions = [
    { href: "/clubs", label: "Explore clubs", icon: Compass, note: "Find your place at The Prep" },
    { href: "/calendar", label: "Open calendar", icon: CalendarDays, note: "See what is happening next" },
    { href: "/announcements", label: "View updates", icon: Megaphone, note: "Catch the latest school news" },
  ];
  const managementActions = canAccessFacultyTools(user.role)
    ? [{ href: "/voting", label: "Create polls", icon: Vote, note: "Launch quick votes without slowing down the day" }]
    : [];
  const allQuickActions = [...quickActions, ...managementActions];

  return (
    <div className="space-y-7">
      {/* Welcome banner */}
      <motion.div
        {...fu(0)}
        className="relative overflow-hidden rounded-[36px] border border-border bg-[linear-gradient(145deg,rgba(255,250,248,0.96),rgba(254,246,241,0.98)_34%,rgba(246,239,252,0.98)_68%,rgba(242,236,248,0.98)_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-7 sm:py-7 lg:px-9 lg:py-8 dark:border-white/10 dark:bg-[linear-gradient(145deg,#05070d_0%,#0a1020_34%,#0d1a33_68%,#101729_100%)] dark:shadow-[0_30px_80px_rgba(12,24,36,0.24)]"
      >
        {/* Orbs */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(139,26,26,.12)_0%,transparent_70%)] blur-[46px] dark:bg-[radial-gradient(circle,rgba(139,26,26,.22)_0%,transparent_70%)]" style={{ transform: "translate(30%, -30%)" }} />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(113,82,255,.08)_0%,transparent_70%)] blur-[50px] dark:bg-[radial-gradient(circle,rgba(113,82,255,.18)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(15,23,42,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.08) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(circle at center, black, transparent 80%)" }} />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.3fr_0.7fr] xl:items-end">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-border bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/56" style={{ fontFamily: "var(--font-mono)" }}>
            {format(new Date(), "EEEE, MMMM d · yyyy")}
            </p>
            <h1 className="max-w-[720px] text-foreground dark:text-white" style={{ fontFamily: "Satoshi, var(--font-body)", fontSize: "clamp(34px,5vw,66px)", fontWeight: 600, letterSpacing: "-.06em", lineHeight: 0.98 }}>
              {greeting}, {firstName}. HawkLife is ready.
            </h1>
            <p className="mt-4 max-w-[560px] text-[15px] leading-[1.7] text-foreground/72 dark:text-white/52">
              Your clubs, announcements, meetings, NHS hours, and applications all move in one cleaner system for St. Joe&apos;s Prep.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { num: membershipCount, label: "My Clubs" },
                { num: upcomingEvents.length, label: "This Week" },
                { num: unreadNotifs, label: "Unread" },
              ].map((s) => (
                <div key={s.label} className="rounded-[24px] border border-border bg-background/70 px-4 py-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card dark:border-white/8 dark:bg-white/[0.04]">
                  <p className="text-foreground dark:text-white" style={{ fontFamily: "Satoshi, var(--font-body)", fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{s.num}</p>
                  <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[.09em] text-muted-foreground dark:text-white/34">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {allQuickActions.map((action, index) => (
              <Link key={action.href} href={action.href}>
                <motion.div
                  {...fu(0.08 + index * 0.05)}
                  className="group rounded-[28px] border border-border bg-background/70 p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:bg-background hover:shadow-card-hover dark:border-white/8 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-primary dark:bg-white/[0.06] dark:text-[#ffbb87]">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground dark:text-white/34 dark:group-hover:text-white/70" />
                  </div>
                  <p className="text-[16px] font-semibold tracking-[-0.03em] text-foreground dark:text-white" style={{ fontFamily: "Satoshi, var(--font-body)" }}>
                    {action.label}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-6 text-foreground/68 dark:text-white/48">{action.note}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { ico: "🏛️", val: membershipCount,       lbl: "Active Clubs",     col: "crimson" },
          { ico: "📅", val: upcomingEvents.length,  lbl: "Upcoming Events",  col: "navy"   },
          { ico: "📣", val: recentPosts.length,     lbl: "New Posts",        col: "gold"   },
          { ico: "🎓", val: nhsRecord?.totalHours ?? "—", lbl: "NHS Hours",  col: "green"  },
        ].map((s, i) => (
          <motion.div key={s.lbl} {...fu(i * 0.05)} className="surface-card rounded-[30px] p-5 card-lift">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-4 text-[17px]" style={{ background: STAT_COLORS[s.col] }}>
              {s.ico}
            </div>
            <p className="text-foreground" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, lineHeight: 1, letterSpacing: "-.02em" }}>{s.val}</p>
            <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 5 }}>{s.lbl}</p>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — My clubs + Feed */}
        <div className="lg:col-span-2 space-y-6">

          {/* My Clubs */}
          <motion.div {...fu(0.1)}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>My Clubs</h2>
              <Link href="/clubs" className="text-[12.5px] font-semibold transition-colors" style={{ color: "#8B1A1A" }}>Browse all →</Link>
            </div>
            {myMemberships.length === 0 ? (
              <div className="surface-card rounded-[28px] p-10 text-center">
                <div className="text-4xl mb-3 opacity-30">🏛️</div>
                <p className="text-muted-foreground" style={{ fontFamily: "var(--font-display)", fontSize: 17 }}>No clubs yet</p>
                <Link href="/clubs" className="inline-block mt-3 text-[13px] font-medium" style={{ color: "#8B1A1A" }}>Browse the directory →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {myMemberships.map((m: any) => (
                  <Link key={m.id} href={`/clubs/${m.club.slug}`}>
                    <div className="surface-card flex items-start gap-3.5 rounded-[24px] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer sm:items-center">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${m.club.gradientFrom}, ${m.club.gradientTo})` }}>
                        {m.club.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-foreground truncate">{m.club.name}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {m.club.meetingDay && `📅 ${m.club.meetingDay}`}
                          {m.club.meetingTime && ` · ${m.club.meetingTime}`}
                        </p>
                      </div>
                      <span className="mt-0.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground sm:mt-0">{m.club.category.toLowerCase()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent announcements */}
          <motion.div {...fu(0.15)}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>Announcements</h2>
              <Link href="/announcements" className="text-[12.5px] font-semibold" style={{ color: "#8B1A1A" }}>See all →</Link>
            </div>
            <div className="surface-card overflow-hidden rounded-[30px]">
              {recentPosts.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-3xl mb-2 opacity-30">📣</div>
                  <p className="text-muted-foreground text-[13px]">No announcements yet</p>
                </div>
              ) : (
                recentPosts.map((post: any, i: number) => (
                  <div key={post.id} className={cn("flex gap-3 px-4 py-4 transition-colors cursor-pointer hover:bg-muted/30 sm:px-5", i < recentPosts.length - 1 && "border-b border-border")}>
                    <div className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm" style={{ background: `linear-gradient(135deg, ${post.club?.gradientFrom ?? "#0C1824"}, ${post.club?.gradientTo ?? "#152438"})` }}>
                      {post.club?.emoji ?? "📣"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[12.5px] font-semibold text-foreground/80">{post.club?.name}</p>
                        <span className="text-[11px] text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
                      </div>
                      <p className="text-[13.5px] font-semibold text-foreground">{post.title}</p>
                      <p className="text-[12.5px] text-muted-foreground mt-0.5 line-clamp-1">{post.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right — NHS + Upcoming */}
        <div className="space-y-5">
          {/* NHS Widget */}
          <motion.div {...fu(0.12)}>
            <NhsWidget record={nhsRecord} />
          </motion.div>

          {/* Upcoming events */}
          <motion.div {...fu(0.18)}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>Upcoming</h2>
              <Link href="/calendar" className="text-[12px] font-semibold" style={{ color: "#8B1A1A" }}>Calendar →</Link>
            </div>
            <div className="surface-card overflow-hidden rounded-[30px]">
              {upcomingEvents.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2 opacity-30">📅</div>
                  <p className="text-muted-foreground text-[12.5px]">No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.map((evt: any, i: number) => (
                  <div key={evt.id} className={cn("flex items-center gap-3.5 px-4 py-3 hover:bg-muted/30 transition-colors", i < upcomingEvents.length - 1 && "border-b border-border")}>
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center justify-center" style={{ background: "rgba(139,26,26,.07)" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "#8B1A1A", lineHeight: 1 }}>{format(new Date(evt.startTime), "d")}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#8B1A1A", opacity: .7 }}>{format(new Date(evt.startTime), "MMM")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{evt.title}</p>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5">{evt.club?.emoji} {evt.club?.name ?? "School Event"} · {format(new Date(evt.startTime), "h:mm a")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function NhsWidget({ record }: { record: NhsRecord | null }) {
  if (!record || record.status === "not_required") {
    return (
      <div className="surface-card rounded-[28px] p-5">
        <p className="text-[13.5px] font-bold text-foreground mb-2">NHS Hours</p>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
          {record ? "NHS hours are tracked for Juniors and Seniors." : "No NHS record found for your account."}
        </p>
      </div>
    );
  }

  const statusCfg = {
    complete:  { label: "Complete ✓", cls: "bg-green-50 text-green-700 dark:bg-green-900/20" },
    on_track:  { label: "On Track",  cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/20" },
    behind:    { label: "Behind",    cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20" },
  }[record.status] ?? { label: "N/A", cls: "bg-muted text-muted-foreground" };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13.5px] font-bold text-foreground">NHS Hours</p>
        <span className={cn("text-[11.5px] font-semibold px-2.5 py-1 rounded-full", statusCfg.cls)}>{statusCfg.label}</span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600, lineHeight: 1, letterSpacing: "-.02em" }}>{record.totalHours}</span>
        <span className="text-muted-foreground pb-1" style={{ fontSize: 16 }}>/ {record.requiredHours} hrs</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full progress-crimson"
          initial={{ width: 0 }}
          animate={{ width: `${record.progressPct}%` }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
      <p className="text-[12px] text-muted-foreground">
        {record.status === "complete"
          ? `🎉 All ${record.requiredHours} hours completed!`
          : `${Math.max(0, record.requiredHours - record.totalHours)} hours remaining`}
      </p>
      {record.activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          {record.activities.slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">{a.name}</p>
                <p className="text-[11px] text-muted-foreground">{a.category}{a.date && ` · ${a.date}`}</p>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600 }}>{a.hours}h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
