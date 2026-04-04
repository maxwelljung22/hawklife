"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const FEATURE_STRIP = [
  "Club applications",
  "Live announcements",
  "NHS tracking",
  "Shared calendar",
] as const;

export function HeroPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#06080e] px-5 py-6 text-white shadow-[0_40px_120px_rgba(0,0,0,0.34)] sm:px-7 sm:py-8 lg:px-8 lg:py-9 xl:flex-[1.15]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(196,46,63,0.18), transparent 24%), radial-gradient(circle at 78% 72%, rgba(80,120,255,0.14), transparent 28%), linear-gradient(180deg, #06080e 0%, #0a0e18 48%, #06080d 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "radial-gradient(circle at center, black, transparent 82%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-12 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(118,80,255,.22),transparent_68%)] blur-3xl"
        animate={reduceMotion ? {} : { scale: [1, 1.06, 0.98, 1], opacity: [0.8, 1, 0.88, 0.8] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="space-y-3">
          <BrandLogo tone="inverse" />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/64">
            <Sparkles className="h-3 w-3" />
            Built for The Prep
          </div>
        </div>

        <div className="my-12 max-w-[680px]">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }}
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/44"
            >
              Built for The Prep
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.72, ease: EASE_OUT, delay: 0.08 } }}
              className="text-balance text-[clamp(42px,7vw,88px)] font-semibold leading-[0.94] tracking-[-0.08em]"
              style={{ fontFamily: "Satoshi, var(--font-body)" }}
            >
              HawkLife
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay: 0.16 } }}
              className="mt-5 max-w-[520px] text-balance text-[15px] leading-7 text-white/56 sm:text-[16px]"
            >
              A cleaner home for clubs, announcements, NHS hours, and schedules at St. Joe&apos;s Prep.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.62, ease: EASE_OUT, delay: 0.24 } }}
              className="mt-8 max-w-[560px] rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">What you can do</p>
              <p className="mt-3 text-[28px] font-semibold tracking-[-0.06em] text-white sm:text-[34px]" style={{ fontFamily: "Satoshi, var(--font-body)" }}>
                Student life, finally in sync.
              </p>
              <p className="mt-3 max-w-[420px] text-[13px] leading-7 text-white/52">
                Browse clubs, track service hours, follow announcements, and keep up with everything happening across St. Joseph&apos;s Preparatory School.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {FEATURE_STRIP.map((item, index) => (
                  <motion.div
                    key={item}
                    whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
                    transition={{ duration: 0.16 }}
                    className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[12px] text-white/74"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.32 + index * 0.05, duration: 0.35, ease: EASE_OUT } }}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <motion.div
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">For students</p>
                  <p className="mt-2 text-[13px] leading-6 text-white/72">Find your clubs, follow updates, and keep the week organized.</p>
                </motion.div>
                <motion.div
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">For leaders</p>
                  <p className="mt-2 text-[13px] leading-6 text-white/72">Manage applications, announcements, and club momentum in one place.</p>
                </motion.div>
              </div>
            </motion.div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/8 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32 sm:flex-row sm:items-center sm:justify-between">
          <span>Philadelphia, PA</span>
          <span>HawkLife for St. Joseph&apos;s Preparatory School</span>
        </div>
      </div>
    </section>
  );
}
