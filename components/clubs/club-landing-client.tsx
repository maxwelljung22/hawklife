"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock3, MapPin, Sparkles, Users } from "lucide-react";
import { joinClub, leaveClub } from "@/app/(app)/clubs/actions";
import { cn, formatRelativeTime, initials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ClubLandingProps = {
  club: any;
  joined: boolean;
  isLeader: boolean;
};

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
};

export function ClubLandingClient({ club, joined: joinedInitially, isLeader }: ClubLandingProps) {
  const [joined, setJoined] = useState(joinedInitially);
  const [memberCount, setMemberCount] = useState(club._count.memberships);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleMembership = () => {
    const next = !joined;
    setJoined(next);
    setMemberCount((count: number) => count + (next ? 1 : -1));

    startTransition(async () => {
      const result = next ? await joinClub(club.id) : await leaveClub(club.id);
      if (result?.error) {
        setJoined(!next);
        setMemberCount((count: number) => count + (next ? -1 : 1));
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      toast({
        title: next ? `Joined ${club.name}` : `Left ${club.name}`,
        description: next ? "You joined the club. The workspace is coming in v4.0.0." : "You can always rejoin from the directory.",
      });
    });
  };

  return (
    <motion.div initial="initial" animate="animate" className="space-y-8">
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
      >
        <div
          className="absolute inset-0"
          style={{
            background: club.bannerUrl
              ? `linear-gradient(135deg, rgba(0,0,0,0.72), rgba(0,0,0,0.44)), url(${club.bannerUrl}) center/cover`
              : `linear-gradient(135deg, ${club.gradientFrom}, ${club.gradientTo})`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_32%),linear-gradient(180deg,transparent,rgba(0,0,0,0.3))]" />
        <div className="relative flex min-h-[23rem] flex-col justify-between px-6 py-7 text-white sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/clubs" className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-white/16">
              Club Directory
            </Link>
            <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              {club.category}
            </span>
          </div>

          <div className="max-w-4xl space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-[4rem] leading-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.24)]">{club.emoji}</span>
              <div>
                <h1 className="text-balance text-[clamp(2.6rem,7vw,5.5rem)] font-semibold tracking-[-0.06em] text-white" style={{ fontFamily: "Inter, var(--font-body)" }}>
                  {club.name}
                </h1>
                <p className="mt-2 max-w-2xl text-[1rem] leading-7 text-white/72 sm:text-[1.05rem]">
                  {club.tagline || "A dedicated space for club updates, collaboration, and student leadership."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-[0.92rem] text-white/78">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3.5 py-2">
                <Users className="h-4 w-4" />
                {memberCount} members
              </span>
              {club.meetingDay ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3.5 py-2">
                  <CalendarDays className="h-4 w-4" />
                  {club.meetingDay}
                </span>
              ) : null}
              {club.meetingTime ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3.5 py-2">
                  <Clock3 className="h-4 w-4" />
                  {club.meetingTime}
                </span>
              ) : null}
              {club.meetingRoom ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3.5 py-2">
                  <MapPin className="h-4 w-4" />
                  {club.meetingRoom}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMembership}
              disabled={isPending}
              className={cn(
                "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200",
                joined
                  ? "border border-white/18 bg-white/10 text-white hover:bg-white/16"
                  : "bg-white text-neutral-950 shadow-[0_18px_40px_rgba(0,0,0,0.18)] hover:bg-neutral-100"
              )}
            >
              {joined ? "Leave Club" : "Join Club"}
            </motion.button>

            <Link
              href={`/clubs/${club.id}/workspace`}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200",
                "bg-neutral-950/80 text-white hover:bg-neutral-950"
              )}
            >
              Coming Soon
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section variants={fadeUp} className="surface-panel rounded-[1.75rem] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">About</p>
          <p className="mt-4 text-[0.98rem] leading-8 text-foreground/78">{club.description}</p>
          {club.tags?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {club.tags.map((tag: string) => (
                <span key={tag} className="rounded-full border border-border/80 bg-background/75 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </motion.section>

        <motion.section variants={fadeUp} className="surface-panel rounded-[1.75rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Workspace</p>
              <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
                Built for club momentum
              </h2>
            </div>
            <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
          </div>
          <p className="mt-4 text-[0.96rem] leading-7 text-muted-foreground">
            Keep announcements, assignments, task progress, and member collaboration in one focused space.
          </p>
          <div className="mt-6 rounded-[1.5rem] border border-border/80 bg-background/80 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Primary action</p>
              <p className="mt-2 text-[1.15rem] font-semibold tracking-[-0.03em] text-foreground">Open the club workspace</p>
              <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">
              The full club workspace is currently locked while we finish the v4.0.0 release.
              </p>
            <Link
              href={`/clubs/${club.id}/workspace`}
              className={cn(
                "mt-5 inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800"
              )}
            >
              Coming Soon in v4.0.0
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section variants={fadeUp} className="surface-panel rounded-[1.75rem] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
              Events
            </h3>
            <span className="text-[12px] text-muted-foreground">{club.events.length} scheduled</span>
          </div>
          <div className="mt-5 space-y-3">
            {club.events.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-border bg-muted/35 px-5 py-8 text-center">
                <p className="text-[0.98rem] font-medium text-foreground">No events scheduled yet</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">The next meeting or event will appear here for members.</p>
              </div>
            ) : (
              club.events.slice(0, 3).map((event: any) => (
                <div key={event.id} className="rounded-[1.4rem] border border-border/80 bg-background/75 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.98rem] font-semibold text-foreground">{event.title}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">{format(new Date(event.startTime), "EEEE, MMM d · h:mm a")}</p>
                    </div>
                    {event.location ? (
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{event.location}</span>
                    ) : null}
                  </div>
                  {event.description ? <p className="mt-3 text-[13.5px] leading-6 text-foreground/70">{event.description}</p> : null}
                </div>
              ))
            )}
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="surface-panel rounded-[1.75rem] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
              Announcements
            </h3>
            <span className="text-[12px] text-muted-foreground">{club.posts.length} recent</span>
          </div>
          <div className="mt-5 space-y-3">
            {club.posts.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-border bg-muted/35 px-5 py-8 text-center">
                <p className="text-[0.98rem] font-medium text-foreground">No updates yet</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">When club leaders post something important, it will land here first.</p>
              </div>
            ) : (
              club.posts.slice(0, 3).map((post: any) => (
                <div key={post.id} className="rounded-[1.4rem] border border-border/80 bg-background/75 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={post.author?.image ?? undefined} />
                      <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                        {initials(post.author?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[0.95rem] font-semibold text-foreground">{post.author?.name}</p>
                      <p className="text-[12px] text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[1rem] font-semibold tracking-[-0.02em] text-foreground">{post.title}</p>
                  <p className="mt-2 text-[13.5px] leading-6 text-foreground/72">{post.content}</p>
                </div>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
