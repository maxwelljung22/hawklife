"use client";

import Link from "next/link";
import Image from "next/image";
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
      <div className={cn("relative shrink-0 overflow-visible", compact ? "h-11 w-12" : "h-12 w-14")}>
        <Image
          src="/hawklife-hawk.png"
          alt="HawkLife hawk logo"
          fill
          sizes={compact ? "48px" : "56px"}
          className="object-contain drop-shadow-[0_12px_26px_rgba(139,26,26,0.24)]"
          priority
        />
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
