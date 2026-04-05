"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Rocket } from "lucide-react";

type Props = {
  club: {
    id: string;
    name: string;
    requiresApp: boolean;
  };
  isLeader: boolean;
  currentApplication: any | null;
  appForm: any | null;
  applications: any[];
};

export function ClubApplicationsPanel({ club }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
        className="surface-panel rounded-[1.75rem] p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Applications</p>
        <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
          Coming soon in v4.0.0
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
          Club applications are temporarily locked while we finish the full v4.0.0 release. Submission flows, status tracking, and leader review tools will return in the update.
        </p>

        <div className="mt-6 rounded-[1.4rem] border border-border/80 bg-background/70 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary))/0.10] text-[hsl(var(--primary))]">
              <Rocket className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[0.98rem] font-semibold text-foreground">Application access is locked for now.</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                You can still explore {club.name}, view announcements, and follow club updates while the applications experience is being polished.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.18, delay: 0.03 } }}
        className="surface-panel rounded-[1.75rem] p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Release note</p>
        <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
          Returning with the next update
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
          We&apos;re bundling club application creation, applicant status views, and leader-side review into the v4.0.0 rollout so the whole experience launches together.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            View applications update
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/clubs"
            className="inline-flex items-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
          >
            Back to directory
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
