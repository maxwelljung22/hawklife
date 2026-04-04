"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ClipboardCheck, LayoutGrid, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const PREVIEW_CARDS = [
  {
    title: "Club directory",
    eyebrow: "For The Prep",
    body: "Discover clubs, compare commitments, and find your people fast.",
    icon: LayoutGrid,
    accent: "from-[#ff8f52] via-[#ff4d7a] to-[#8a2eff]",
    className: "2xl:absolute 2xl:left-0 2xl:top-24 2xl:w-[280px] 2xl:-rotate-[7deg]",
  },
  {
    title: "Charter applications",
    eyebrow: "Built for St. Joe's Prep",
    body: "Launch new clubs with a polished, multi-step charter workflow.",
    icon: ClipboardCheck,
    accent: "from-[#7a101e] via-[#c22c44] to-[#f08b7f]",
    className: "2xl:absolute 2xl:left-[14%] 2xl:bottom-0 2xl:w-[300px] 2xl:rotate-[3deg]",
  },
  {
    title: "Live calendar",
    eyebrow: "One shared campus rhythm",
    body: "Meetings, events, and deadlines in one elegant planning surface.",
    icon: CalendarDays,
    accent: "from-[#182c58] via-[#3556ac] to-[#8cb9ff]",
    className: "2xl:absolute 2xl:right-[13%] 2xl:top-20 2xl:w-[292px] 2xl:rotate-[5deg]",
  },
  {
    title: "Announcements",
    eyebrow: "Signal, not noise",
    body: "Push the updates that matter across St. Joseph's Preparatory School.",
    icon: Megaphone,
    accent: "from-[#322010] via-[#8e5d1f] to-[#f3c978]",
    className: "2xl:absolute 2xl:right-0 2xl:bottom-6 2xl:w-[280px] 2xl:-rotate-[4deg]",
  },
];

export function HeroPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#05070d] px-5 py-6 text-white shadow-[0_40px_120px_rgba(0,0,0,0.42)] sm:px-7 sm:py-8 lg:min-h-[820px] lg:px-10 lg:py-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 16%, rgba(92,102,255,0.12), transparent 20%), radial-gradient(circle at 20% 24%, rgba(196,46,63,0.18), transparent 26%), radial-gradient(circle at 80% 74%, rgba(212,143,62,0.12), transparent 24%), linear-gradient(180deg, #06080e 0%, #090d16 48%, #06080d 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(circle at center, black, transparent 82%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-16 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(120,72,255,.28),transparent_68%)] blur-3xl"
        animate={reduceMotion ? {} : { scale: [1, 1.06, 0.98, 1], opacity: [0.85, 1, 0.92, 0.85] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <BrandLogo tone="inverse" />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
              <Sparkles className="h-3 w-3" />
              St. Joseph&apos;s Preparatory School
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white/60">
            <ShieldCheck className="h-3.5 w-3.5 text-[#ffb9a7]" />
            Built for St. Joe&apos;s Prep
          </div>
        </div>

        <div className="relative mt-10 flex-1">
          <div className="mx-auto max-w-[760px] text-center">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }}
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/44"
            >
              Campus OS for The Prep
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.72, ease: EASE_OUT, delay: 0.08 } }}
              className="text-balance text-[clamp(42px,8vw,108px)] font-semibold leading-[0.94] tracking-[-0.08em]"
              style={{ fontFamily: "Satoshi, var(--font-body)" }}
            >
              HawkLife
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay: 0.16 } }}
              className="mx-auto mt-5 max-w-[630px] text-balance text-[15px] leading-7 text-white/56 sm:text-[16px]"
            >
              The polished student platform for St. Joseph&apos;s Preparatory School. Clubs, announcements, NHS hours, charter applications, and schedules all move with one sharper rhythm.
            </motion.p>
          </div>

          <div className="mt-10 grid gap-4 xl:grid-cols-2 2xl:mt-16 2xl:block 2xl:min-h-[470px]">
            {PREVIEW_CARDS.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 26, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: EASE_OUT, delay: 0.18 + index * 0.08 } }}
                whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }}
              className={`overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl ${card.className}`}
              >
                <div className={`h-32 bg-gradient-to-br ${card.accent}`} />
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/44">{card.eyebrow}</p>
                    <card.icon className="h-4 w-4 text-white/72" />
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.04em] text-white" style={{ fontFamily: "Satoshi, var(--font-body)" }}>
                    {card.title}
                  </h3>
                  <p className="text-[12.5px] leading-6 text-white/56">{card.body}</p>
                  <div className="space-y-2 pt-2">
                    <div className="h-2 rounded-full bg-white/8">
                      <div className="h-full w-[72%] rounded-full bg-white/70" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px] text-white/46">Reviewed quickly</div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px] text-white/46">Cleaner decisions</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.45 } }}
              className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl xl:col-span-2 2xl:absolute 2xl:left-1/2 2xl:top-36 2xl:w-[360px] 2xl:-translate-x-1/2"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">Live snapshot</p>
                  <p className="mt-1 text-[18px] font-semibold tracking-[-0.04em] text-white" style={{ fontFamily: "Satoshi, var(--font-body)" }}>
                    Student life, finally organized
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ffb8aa]">
                  HawkLife
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,130,98,0.18),rgba(125,78,255,0.28))] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/56">This week at The Prep</p>
                  <p className="mt-3 text-[28px] font-semibold tracking-[-0.06em] text-white" style={{ fontFamily: "Satoshi, var(--font-body)" }}>
                    18 clubs. 12 events. 1 place.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] text-white/76">Charter reviews</span>
                    <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] text-white/76">Meeting reminders</span>
                    <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] text-white/76">NHS progress</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">Club momentum</p>
                    <p className="mt-3 text-[30px] font-semibold tracking-[-0.06em] text-white" style={{ fontFamily: "Satoshi, var(--font-body)" }}>
                      94%
                    </p>
                    <p className="mt-2 text-[12px] leading-6 text-white/50">Applications, approvals, and leadership updates move in one clean flow.</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">Why it lands</p>
                    <p className="mt-3 text-[15px] font-semibold tracking-[-0.03em] text-white" style={{ fontFamily: "Satoshi, var(--font-body)" }}>
                      Personalized for St. Joseph&apos;s Preparatory School
                    </p>
                    <p className="mt-2 text-[12px] leading-6 text-white/50">Crimson-forward, academic, and built to feel like a product students actually enjoy using.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/8 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32 sm:flex-row sm:items-center sm:justify-between">
          <span>Philadelphia, PA</span>
          <span>St. Joseph&apos;s Preparatory School student platform</span>
        </div>
      </div>
    </section>
  );
}
