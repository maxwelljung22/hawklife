// app/(app)/changelog/changelog-client.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { label: string; cls: string; dot: string; icon: string }> = {
  FEATURE:      { label: "Feature",      cls: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",   dot: "bg-blue-500",   icon: "✦" },
  IMPROVEMENT:  { label: "Improvement",  cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20", dot: "bg-emerald-500", icon: "↑" },
  BUG_FIX:      { label: "Bug Fix",      cls: "bg-muted text-muted-foreground",                  dot: "bg-muted-foreground", icon: "⬡" },
  CLUB_UPDATE:  { label: "Club Update",  cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/20", dot: "bg-amber-500",  icon: "⊕" },
  ANNOUNCEMENT: { label: "Announcement", cls: "bg-crimson/8 text-crimson",                       dot: "bg-crimson",    icon: "◈" },
};

const FILTERS = ["All", "FEATURE", "IMPROVEMENT", "BUG_FIX", "CLUB_UPDATE", "ANNOUNCEMENT"];

interface Props { entries: any[] }

export function ChangelogClient({ entries }: Props) {
  const [filter, setFilter] = useState("All");

  const filtered = entries.filter((e) => filter === "All" || e.type === filter);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-[10.5px] font-bold tracking-[.10em] uppercase text-crimson mb-2">Platform Updates</p>
        <h1 className="font-display text-[34px] font-semibold text-foreground tracking-tight">
          What&apos;s <span className="italic">New</span>
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">Every feature, fix, and improvement we ship.</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-[12.5px] font-[500] border transition-all",
              filter === f ? "bg-crimson border-crimson text-white shadow-md shadow-crimson/20" : "bg-card border-border text-muted-foreground hover:border-crimson/50"
            )}
          >
            {f === "All" ? "All" : TYPE_CONFIG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-9">
        <div className="absolute left-[11px] top-1 bottom-1 w-px bg-gradient-to-b from-border to-transparent" />

        {filtered.map((entry, i) => {
          const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.FEATURE;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }}
              className="relative mb-7"
            >
              {/* Timeline dot */}
              <div className={cn("absolute -left-[31px] top-[5px] w-2.5 h-2.5 rounded-full border-2 border-card", cfg.dot)} />

              <div className={cn("bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200", entry.isFeatured && "border-crimson/20 shadow-[0_0_0_1px_rgba(139,26,26,0.06)]")}>
                {entry.isFeatured && <div className="h-0.5 bg-gradient-to-r from-crimson via-gold to-navy" />}
                <div className="px-6 py-5">
                  <div className="flex items-start gap-3 mb-3.5">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[16px] flex-shrink-0", cfg.cls)}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-[15px] font-bold text-foreground">{entry.title}</h3>
                        <span className={cn("text-[10px] font-bold uppercase tracking-[.05em] px-2 py-0.5 rounded-full", cfg.cls)}>{cfg.label}</span>
                        {entry.isFeatured && <span className="text-[10px] font-bold uppercase tracking-[.05em] px-2 py-0.5 rounded-full bg-crimson/10 text-crimson">Featured</span>}
                      </div>
                      <p className="text-[12px] text-muted-foreground">{format(new Date(entry.publishedAt), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-[13.5px] leading-relaxed text-foreground/75">
                    {String(entry.content)
                      .split(/\n{2,}/)
                      .map((paragraph: string, index: number) => (
                        <p key={`${entry.id}-paragraph-${index}`} className="whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl opacity-30 mb-3">📋</div>
            <p className="font-display text-[17px] text-muted-foreground">No updates of this type</p>
          </div>
        )}
      </div>
    </div>
  );
}
