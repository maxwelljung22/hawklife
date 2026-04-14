"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { joinClub, leaveClub } from "./actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { canAccessAdmin } from "@/lib/roles";

const CATEGORIES = ["All", "STEM", "Humanities", "Arts", "Business", "Service", "Sports", "Faith"];
const COMMITMENTS = ["Any", "Low", "Medium", "High"];

interface Club {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  emoji: string;
  tagline: string | null;
  description: string;
  category: string;
  commitment: string;
  tags: string[];
  gradientFrom: string;
  gradientTo: string;
  meetingDay: string | null;
  meetingTime: string | null;
  meetingRoom: string | null;
  requiresApp: boolean;
  _count: { memberships: number };
  joined: boolean;
}

interface Props {
  clubs: Club[];
  role: UserRole;
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

export function ClubsClient({ clubs: initialClubs, role }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [commitment, setCommitment] = useState("Any");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [clubs, updateClubs] = useOptimistic(
    initialClubs,
    (current, payload: { clubId: string; joined: boolean }) =>
      current.map((club) =>
        club.id === payload.clubId
          ? {
              ...club,
              joined: payload.joined,
              _count: {
                memberships: club._count.memberships + (payload.joined ? 1 : -1),
              },
            }
          : club
      )
  );

  const filtered = clubs.filter((club) => {
    const matchesCategory = category === "All" || club.category.toLowerCase() === category.toLowerCase();
    const matchesCommitment = commitment === "Any" || club.commitment.toLowerCase() === commitment.toLowerCase();
    const matchesQuery =
      !query ||
      [club.name, club.tagline ?? "", club.description, ...club.tags].some((value) =>
        value.toLowerCase().includes(query.toLowerCase())
      );

    return matchesCategory && matchesCommitment && matchesQuery;
  });

  const handleMembership = useCallback(
    async (club: Club) => {
      const next = !club.joined;
      updateClubs({ clubId: club.id, joined: next });

      startTransition(async () => {
        const result = next ? await joinClub(club.id) : await leaveClub(club.id);
        if (result?.error) {
          updateClubs({ clubId: club.id, joined: !next });
          toast({ title: "Error", description: result.error, variant: "destructive" });
          return;
        }

        toast({
          title: next ? `Joined ${club.name}` : `Left ${club.name}`,
          description: next ? "You can open the club workspace right away now." : "You can always rejoin later.",
        });
      });
    },
    [toast, updateClubs]
  );

  return (
    <motion.div initial="initial" animate="animate" className="space-y-8">
      <motion.section variants={fadeUp} className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,26,26,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.05),transparent_18%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Club Directory</p>
            <h1 className="mt-4 text-balance text-[clamp(2.4rem,6vw,4.7rem)] font-semibold tracking-[-0.06em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
              Find your people.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              Explore clubs through a cleaner directory, then step directly into each club&apos;s landing page and workspace.
            </p>
          </div>

          {canAccessAdmin(role) ? (
            <Link
              href="/admin/clubs/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <Plus className="h-4 w-4" />
              New Club
            </Link>
          ) : null}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="rounded-[1.8rem] border border-border/80 bg-card/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-6">
        <div className="space-y-4">
          <div className="min-w-0">
            <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Search</label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clubs, topics, and interests"
                className="w-full rounded-[1.25rem] border border-border bg-background pl-11 pr-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
              />
            </div>
          </div>

          <div className="grid gap-4 2xl:grid-cols-2">
            <ChipGroup label="Category" items={CATEGORIES} value={category} onChange={setCategory} />
            <ChipGroup label="Commitment" items={COMMITMENTS} value={commitment} onChange={setCommitment} />
          </div>
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            {filtered.length === clubs.length ? `Showing all ${filtered.length} clubs` : `Showing ${filtered.length} of ${clubs.length} clubs`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((club, index) => (
                <motion.article
                  key={club.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03, duration: 0.18 } }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.18 }}
                  className="group overflow-hidden rounded-[1.5rem] border border-border/80 bg-card shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
                >
                  <Link href={`/clubs/${club.slug}`} className="block">
                    <div
                      className="relative h-32 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${club.gradientFrom}, ${club.gradientTo})` }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%),linear-gradient(180deg,transparent,rgba(0,0,0,0.2))]" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-4">
                        <div>
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1rem] border border-white/15 bg-white/10 text-[2.1rem] leading-none drop-shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                            {club.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={club.logoUrl} alt={`${club.name} logo`} className="h-full w-full object-cover" />
                            ) : (
                              club.emoji
                            )}
                          </div>
                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(255,248,240,0.96)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] dark:text-white/82">
                            {club.category}
                          </p>
                        </div>
                        {club.requiresApp ? (
                          <span className="rounded-full border border-[rgba(255,255,255,0.45)] bg-[rgba(255,248,240,0.92)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.12)] dark:border-white/20 dark:bg-white/12 dark:text-white/84 dark:shadow-none">
                            Apply
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  <div className="space-y-4 p-4">
                    <div>
                      <Link href={`/clubs/${club.slug}`} className="block">
                        <h2 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-foreground transition-colors duration-200 group-hover:text-[hsl(var(--primary))]" style={{ fontFamily: "Inter, var(--font-body)" }}>
                          {club.name}
                        </h2>
                      </Link>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-5.5 text-muted-foreground">
                        {club.tagline || club.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {club._count.memberships}
                      </span>
                      {club.meetingDay ? <span className="rounded-full border border-border bg-background px-3 py-1.5">{club.meetingDay}</span> : null}
                      {club.meetingRoom ? <span className="rounded-full border border-border bg-background px-3 py-1.5">{club.meetingRoom}</span> : null}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleMembership(club)}
                        disabled={isPending}
                        className={cn(
                          "rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                          club.joined
                            ? "border border-border bg-background text-foreground hover:bg-muted"
                            : "bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                        )}
                      >
                        {club.joined ? "Joined" : "Join Club"}
                      </button>
                      <Link
                        href={club.joined ? `/clubs/${club.slug}/workspace` : `/clubs/${club.slug}`}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200",
                          club.joined
                            ? "border border-border bg-background text-foreground hover:bg-muted"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {club.joined ? "Open Workspace" : "View Club"}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  );
}

function ChipGroup({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full flex-nowrap gap-2 pr-1">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3.5 py-2 text-[12px] font-medium transition-all duration-200",
              value === item
                ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                : "border-border bg-background text-muted-foreground hover:-translate-y-0.5 hover:text-foreground"
            )}
          >
            {item}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-border bg-card/70 px-6 py-16 text-center">
      <p className="text-[1.05rem] font-semibold text-foreground">No clubs match those filters</p>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-6 text-muted-foreground">
        Try a broader search or reset the category and commitment filters to explore more clubs.
      </p>
    </div>
  );
}
