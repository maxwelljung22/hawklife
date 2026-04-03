"use client";

import { motion } from "framer-motion";
import { CHARTER_STEPS, getCharterStrengthLabel } from "@/lib/charter";
import { cn } from "@/lib/utils";

interface CharterProgressProps {
  currentStep: number;
  strength: number;
}

export function CharterProgress({ currentStep, strength }: CharterProgressProps) {
  return (
    <div className="sticky top-[88px] z-20 mb-8">
      <div className="rounded-[28px] border border-neutral-200/80 bg-white/92 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/88">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Charter strength</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white">{strength}%</span>
              <span className="pb-1 text-sm text-neutral-500 dark:text-neutral-400">{getCharterStrengthLabel(strength)}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 md:max-w-xl">
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-neutral-900 via-neutral-700 to-emerald-500 dark:from-white dark:via-neutral-200 dark:to-emerald-400"
                animate={{ width: `${strength}%` }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {CHARTER_STEPS.map((step, index) => {
                const active = index === currentStep;
                const complete = index < currentStep;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded-2xl border px-3 py-2 transition-all duration-200",
                      active
                        ? "border-neutral-900 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                        : complete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-400"
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{index + 1}</p>
                    <p className="mt-1 truncate text-[12px] font-medium">{step.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
