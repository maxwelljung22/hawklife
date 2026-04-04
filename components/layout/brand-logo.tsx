"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
  tone?: "default" | "inverse";
  className?: string;
}

export function BrandLogo({ href = "/dashboard", compact = false, tone = "default", className }: BrandLogoProps) {
  const inverse = tone === "inverse";

  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)} aria-label="HawkLife home">
      <div
        className={cn(
          "relative flex items-center justify-center rounded-[18px] border border-white/10 shadow-[0_18px_44px_rgba(139,26,26,0.24)]",
          compact ? "h-11 w-11" : "h-12 w-12"
        )}
        style={{ background: "linear-gradient(145deg, #7F1417 0%, #B52228 54%, #F09A8D 120%)" }}
      >
        <div className="absolute inset-[1px] rounded-[16px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_46%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
        <svg className="relative h-5 w-5" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 4h12M4 8h8M6 12h4" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="truncate text-[22px] font-medium tracking-[-0.06em]" style={{ fontFamily: "Satoshi, var(--font-body)" }}>
          <span className={cn(inverse ? "text-white/95" : "text-neutral-950 dark:text-white/95")}>Hawk</span>
          <span className="brand-gradient ml-0.5 bg-clip-text text-transparent">
            Life
          </span>
        </div>
        {!compact ? (
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", inverse ? "text-white/45" : "text-neutral-500 dark:text-white/45")}>
            St. Joseph&apos;s Preparatory School
          </p>
        ) : null}
      </div>
    </Link>
  );
}
