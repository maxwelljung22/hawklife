// app/(app)/applications/applications-client.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

const STATUS_CONFIG = {
  SUBMITTED:     { icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20",      label: "Submitted"    },
  UNDER_REVIEW:  { icon: AlertCircle,   color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20",        label: "Under Review" },
  ACCEPTED:      { icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20",  label: "Accepted ✓"  },
  REJECTED:      { icon: XCircle,       color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/20",          label: "Not Accepted" },
  WAITLISTED:    { icon: AlertCircle,   color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-900/20",    label: "Waitlisted"   },
};

export function ApplicationsClient({ myApplications, openForms }: any) {
  return (
    <div className="space-y-10 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-[10.5px] font-bold tracking-[.10em] uppercase text-crimson mb-2">Competitive Programs</p>
        <h1 className="font-display text-[34px] font-semibold text-foreground tracking-tight">
          <span className="italic">Applications</span>
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Apply to competitive clubs and track your applications.
        </p>
      </div>

      {/* Open Opportunities */}
      {openForms.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-[20px] font-semibold text-foreground">Open Opportunities</h2>
          {openForms.map((form: any, i: number) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
              className="bg-card border border-border rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="p-5 flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${form.club.gradientFrom}, ${form.club.gradientTo})` }}
                >
                  {form.club.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-foreground">{form.club.name}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">{form.club.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                      {form.club.category.toLowerCase()}
                    </span>
                    {form.deadline && (
                      <span className="text-[11px] text-amber-600 font-medium">
                        Deadline: {format(new Date(form.deadline), "MMM d, yyyy")}
                      </span>
                    )}
                    {form.maxSlots && (
                      <span className="text-[11px] text-muted-foreground">{form.maxSlots} spots</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/clubs/${form.club.slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-crimson text-white rounded-xl text-[13px] font-medium hover:bg-crimson/90 transition-all shadow-md shadow-crimson/20 flex-shrink-0"
                >
                  Apply <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {/* My Applications */}
      <section className="space-y-4">
        <h2 className="font-display text-[20px] font-semibold text-foreground">
          My Applications
          {myApplications.length > 0 && (
            <span className="ml-2 text-[14px] font-normal text-muted-foreground">({myApplications.length})</span>
          )}
        </h2>

        {myApplications.length === 0 ? (
          <div className="text-center py-14 bg-card border border-border rounded-2xl">
            <div className="text-4xl opacity-20 mb-3">📋</div>
            <p className="font-display text-[17px] text-muted-foreground">No applications yet</p>
            <p className="text-[13px] text-muted-foreground/60 mt-1.5">Apply to competitive clubs above.</p>
          </div>
        ) : (
          myApplications.map((app: any, i: number) => {
            const cfg = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.SUBMITTED;
            const Icon = cfg.icon;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                className="bg-card border border-border rounded-2xl p-5 shadow-card"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                    {app.club.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">{app.club.name}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Submitted {formatRelativeTime(app.createdAt)}</p>
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full", cfg.bg, cfg.color)}>
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </div>
                </div>
                {app.reviewNotes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[11px] font-bold uppercase tracking-[.07em] text-muted-foreground mb-1">Reviewer Notes</p>
                    <p className="text-[13px] text-foreground/75">{app.reviewNotes}</p>
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-border">
                  <Link
                    href={`/clubs/${app.club.slug}`}
                    className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground transition-colors duration-200 hover:text-[hsl(var(--primary))]"
                  >
                    View club page
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })
        )}
      </section>
    </div>
  );
}
