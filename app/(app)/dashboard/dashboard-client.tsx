"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { formatRelativeTime, cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { NhsRecord } from "@/lib/airtable";

interface Props {
  user:            { name?: string | null; email?: string | null; image?: string | null; role: string };
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

  return (
    <div className="space-y-7">
      {/* Welcome banner */}
      <motion.div
        {...fu(0)}
        className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.07)] px-5 py-6 shadow-[0_30px_80px_rgba(12,24,36,0.18)] sm:px-7 sm:py-7 lg:flex lg:items-center lg:justify-between lg:px-9 lg:py-8"
        style={{ background: "linear-gradient(135deg, #0C1824 0%, #12263A 58%, #182D45 100%)" }}
      >
        {/* Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,26,26,.18) 0%, transparent 70%)", filter: "blur(40px)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 right-32 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(138,110,47,.10) 0%, transparent 70%)", filter: "blur(40px)" }} />

        <div className="relative z-10">
          <p className="mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[.16em] uppercase" style={{ color: "rgba(255,255,255,.56)", fontFamily: "var(--font-mono)" }}>
            {format(new Date(), "EEEE, MMMM d · yyyy")}
          </p>
          <h1 className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.015em", lineHeight: 1.15 }}>
            {greeting}, <em style={{ fontStyle: "italic", color: "rgba(244,240,232,.72)" }}>{firstName}</em> 👋
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.38)", marginTop: 5 }}>
            {upcomingEvents.length > 0
              ? `${upcomingEvents.length} upcoming event${upcomingEvents.length !== 1 ? "s" : ""} this week`
              : "No upcoming events this week"}
          </p>
        </div>

        <div className="relative z-10 hidden lg:flex gap-8">
          {[
            { num: membershipCount, label: "My Clubs" },
            { num: upcomingEvents.length, label: "This Week" },
            { num: unreadNotifs, label: "Unread" },
          ].map((s) => (
            <div key={s.label} className="rounded-[24px] border border-white/8 bg-white/5 px-5 py-4 text-center backdrop-blur-md">
              <p className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{s.num}</p>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "rgba(255,255,255,.32)", marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-3 gap-2.5 lg:hidden">
          {[
            { num: membershipCount, label: "Clubs" },
            { num: upcomingEvents.length, label: "Week" },
            { num: unreadNotifs, label: "Unread" },
          ].map((s) => (
            <div key={s.label} className="rounded-[20px] border border-white/8 bg-white/5 px-3 py-3 text-center backdrop-blur-md">
              <p className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{s.num}</p>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.42)", marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
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
          <motion.div key={s.lbl} {...fu(i * 0.05)} className="surface-card rounded-[28px] p-5 card-lift">
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
            <div className="surface-card overflow-hidden rounded-[28px]">
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
            <div className="surface-card overflow-hidden rounded-[28px]">
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
