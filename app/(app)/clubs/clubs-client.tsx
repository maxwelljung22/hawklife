// app/(app)/clubs/clubs-client.tsx
"use client";

import { useState, useOptimistic, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { joinClub, leaveClub } from "./actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@prisma/client";
import { canAccessAdmin } from "@/lib/roles";

const CATEGORIES = ["All", "STEM", "Humanities", "Arts", "Business", "Service", "Sports", "Faith"];
const COMMITMENTS = ["Any", "Low", "Medium", "High"];

interface Club {
  id: string; slug: string; name: string; emoji: string;
  tagline: string | null; description: string; category: string;
  commitment: string; tags: string[]; gradientFrom: string; gradientTo: string;
  meetingDay: string | null; meetingTime: string | null; meetingRoom: string | null;
  requiresApp: boolean; _count: { memberships: number }; joined: boolean;
}

interface Props {
  clubs: Club[];
  userId: string;
  role: UserRole;
}

export function ClubsClient({ clubs: initialClubs, userId, role }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [com, setCom] = useState("Any");
  const [isPending, startTransition] = useTransition();
  const [optimisticClubs, updateOptimistic] = useOptimistic(
    initialClubs,
    (state, { clubId, joined }: { clubId: string; joined: boolean }) =>
      state.map((c) =>
        c.id === clubId
          ? {
              ...c,
              joined,
              _count: { memberships: c._count.memberships + (joined ? 1 : -1) },
            }
          : c
      )
  );
  const { toast } = useToast();

  const filtered = optimisticClubs.filter((c) => {
    const catOk = cat === "All" || c.category.toLowerCase() === cat.toLowerCase();
    const comOk = com === "Any" || c.commitment.toLowerCase() === com.toLowerCase();
    const qOk   = !q || [c.name, c.description, c.tagline ?? "", ...c.tags].some((s) =>
      s.toLowerCase().includes(q.toLowerCase())
    );
    return catOk && comOk && qOk;
  });

  const handleToggle = useCallback(
    async (club: Club) => {
      const next = !club.joined;
      updateOptimistic({ clubId: club.id, joined: next });

      startTransition(async () => {
        const result = next
          ? await joinClub(club.id)
          : await leaveClub(club.id);

        if (result?.error) {
          // Roll back — flip it back
          updateOptimistic({ clubId: club.id, joined: !next });
          toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
          toast({
            title: next ? `Joined ${club.name}! 🎉` : `Left ${club.name}`,
            description: next
              ? "You'll receive announcements and event updates."
              : "You've been removed from this club.",
          });
        }
      });
    },
    [updateOptimistic, toast]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] font-bold tracking-[.10em] uppercase text-crimson mb-2">
            St. Joseph&apos;s Preparatory
          </p>
          <h1 className="font-display text-[34px] font-semibold text-foreground tracking-tight leading-none">
            Club{" "}
            <span className="italic">Directory</span>
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            {initialClubs.length} organizations — find your community at Prep.
          </p>
        </div>
        {canAccessAdmin(role) && (
          <Link
            href="/admin/clubs/new"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-crimson px-4 py-2.5 text-[13.5px] font-medium text-white shadow-lg shadow-crimson/25 transition-all duration-150 hover:-translate-y-0.5 hover:bg-crimson/90 hover:shadow-crimson/35 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New Club
          </Link>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clubs, tags, descriptions…"
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/10 transition-all"
          />
        </div>

        {/* Category chips */}
        <div className="space-y-3">
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2 px-1">
              <span className="text-[10.5px] font-bold uppercase tracking-[.09em] text-muted-foreground/60">Category</span>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12.5px] font-[500] transition-all duration-150",
                    cat === c
                      ? "bg-crimson border-crimson text-white shadow-md shadow-crimson/20"
                      : "bg-card border-border text-muted-foreground hover:border-crimson/50 hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2 px-1">
              <span className="text-[10.5px] font-bold uppercase tracking-[.09em] text-muted-foreground/60">Commitment</span>
              {COMMITMENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCom(c)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12.5px] font-[500] transition-all duration-150",
                    com === c
                      ? "bg-navy border-navy text-white"
                      : "bg-card border-border text-muted-foreground hover:border-navy/50 hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-[12px] text-muted-foreground -mb-2">
        {filtered.length === initialClubs.length
          ? `Showing all ${filtered.length} clubs`
          : `Showing ${filtered.length} of ${initialClubs.length} clubs`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-full text-center py-20"
        >
          <div className="text-5xl mb-4 opacity-30">🔍</div>
          <p className="font-display text-[20px] text-muted-foreground">No clubs found</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">Try adjusting your search or filters.</p>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((club, i) => (
              <ClubCard
                key={club.id}
                club={club}
                index={i}
                onToggle={() => handleToggle(club)}
                isPending={isPending}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// ─── Club Card ────────────────────────────────────────────────────────────────
function ClubCard({
  club,
  index,
  onToggle,
  isPending,
}: {
  club: Club;
  index: number;
  onToggle: () => void;
  isPending: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04, duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Hero */}
      <Link href={`/clubs/${club.slug}`}>
        <div className="relative h-[108px] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${club.gradientFrom}, ${club.gradientTo})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Emoji */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] text-[38px] drop-shadow-md leading-none">
            {club.emoji}
          </div>
          {/* Category badge */}
          <div className="absolute bottom-2.5 left-3">
            <span className="text-[9.5px] font-bold uppercase tracking-[.06em] px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/88 border border-white/14">
              {club.category.charAt(0) + club.category.slice(1).toLowerCase()}
            </span>
          </div>
          {club.requiresApp && (
            <div className="absolute bottom-2.5 right-3">
              <span className="text-[9.5px] font-bold uppercase tracking-[.06em] px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/88 border border-white/14">
                Apply
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <Link href={`/clubs/${club.slug}`} className="block px-4 pt-3.5 pb-3">
        <h3 className="font-display text-[16px] font-semibold text-foreground leading-tight mb-1 group-hover:text-crimson transition-colors">
          {club.name}
        </h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">{club.description}</p>
      </Link>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.3" stroke="currentColor" strokeWidth="1.2"/><path d="M2 9.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            {club._count.memberships}
          </span>
          {club.meetingDay && (
            <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><rect x="1" y="1.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 1v1.5M8 1v1.5M1 4.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {club.meetingDay.split(" ")[0]}
            </span>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggle}
          disabled={isPending}
          className={cn(
            "w-full rounded-lg border px-3.5 py-2 text-[12px] font-medium transition-all duration-150 sm:w-auto",
            club.joined
              ? "bg-muted border-border text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20"
              : "bg-crimson border-crimson text-white shadow-md shadow-crimson/20 hover:bg-crimson/90 hover:shadow-crimson/30"
          )}
        >
          {club.joined ? "✓ Joined" : "+ Join"}
        </motion.button>
      </div>
    </motion.div>
  );
}
