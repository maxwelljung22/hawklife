"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, PaintBucket } from "lucide-react";
import { DASHBOARD_THEMES } from "@/lib/dashboard-preferences";
import { useDashboardPreferences } from "@/components/providers/dashboard-preferences-provider";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const { theme, setTheme } = useDashboardPreferences();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Personalization</p>
          <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.6rem)] font-semibold tracking-[-0.06em] text-foreground">
            Dashboard settings
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-muted-foreground">
            Pick a background theme that changes the dashboard accent system without sacrificing contrast. These presets are locked to safe foreground values so text stays readable.
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
      </div>

      <div className="surface-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
            <PaintBucket className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">Theme presets</h2>
            <p className="text-[13px] text-muted-foreground">Seven curated palettes. No raw hex input, no unreadable combinations.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DASHBOARD_THEMES.map((option, index) => {
            const active = option.id === theme;
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04 } }}
                onClick={() => setTheme(option.id)}
                className={cn(
                  "group relative overflow-hidden rounded-[1.6rem] border p-4 text-left transition-all duration-200",
                  active
                    ? "border-[hsl(var(--primary))] bg-card shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
                    : "border-border bg-card/80 hover:-translate-y-0.5 hover:border-[hsl(var(--primary)/0.45)] hover:shadow-card-hover"
                )}
              >
                <div className="h-28 rounded-[1.25rem]" style={{ background: option.preview }} />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.03em] text-foreground">{option.name}</p>
                    <p className="mt-1 text-[12.5px] leading-6 text-muted-foreground">{option.description}</p>
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                      active
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "border-border text-transparent"
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

