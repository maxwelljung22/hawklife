"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

const qrPattern = [
  1, 1, 1, 0, 1, 1, 0, 1, 1,
  1, 0, 1, 0, 0, 1, 0, 0, 1,
  1, 1, 1, 0, 1, 1, 1, 0, 1,
  0, 0, 0, 1, 0, 0, 1, 0, 0,
  1, 1, 0, 0, 1, 1, 0, 1, 1,
  1, 0, 1, 0, 0, 1, 0, 0, 1,
  0, 1, 1, 1, 1, 0, 1, 1, 0,
  1, 0, 0, 0, 1, 0, 0, 1, 1,
  1, 1, 1, 0, 1, 1, 0, 1, 1,
];

function SceneFrame({
  sceneRef,
  className,
  children,
}: {
  sceneRef: any;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section ref={sceneRef} className={cn("relative min-h-[150svh]", className)}>
      <div className="sticky top-0 flex min-h-[100svh] items-center justify-center overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function ProblemLine({
  line,
  index,
  progress,
  reduceMotion,
}: {
  line: string;
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const start = 0.2 + index * 0.18;
  const opacity = useTransform(progress, [start - 0.08, start, start + 0.22, start + 0.34], [0, 1, 1, 0.15]);
  const y = useTransform(progress, [start - 0.08, start + 0.1], [reduceMotion ? 0 : 24, 0]);

  return (
    <motion.p
      style={{ opacity, y }}
      className={cn(
        "font-display tracking-[-0.06em] text-white",
        index === 0 ? "text-[clamp(2.25rem,7vw,5.75rem)]" : "text-[clamp(2rem,6vw,4.75rem)] text-white/78"
      )}
    >
      {line}
    </motion.p>
  );
}

const featureStories = [
  {
    label: "Flex Time",
    eyebrow: "Session flow",
    blurb: "Choose the right room in seconds.",
    metrics: [
      { value: "2:05", label: "Starts" },
      { value: "18", label: "Sessions" },
      { value: "1 tap", label: "Join" },
    ],
    lines: ["Live capacity", "Instant join", "Clear rooms"],
  },
  {
    label: "Clubs",
    eyebrow: "Club life",
    blurb: "Every club finally has a real home.",
    metrics: [
      { value: "12", label: "Active clubs" },
      { value: "4", label: "Posts today" },
      { value: "3", label: "Events next" },
    ],
    lines: ["Club updates", "Resources", "Member view"],
  },
  {
    label: "Attendance",
    eyebrow: "Verified",
    blurb: "Attendance that feels immediate and real.",
    metrics: [
      { value: "QR", label: "Check-in" },
      { value: "Live", label: "Status" },
      { value: "0 lag", label: "Feedback" },
    ],
    lines: ["Scan quickly", "Mark late", "Track instantly"],
  },
  {
    label: "Everything connected",
    eyebrow: "Core system",
    blurb: "One system for the rhythm of the Prep.",
    metrics: [
      { value: "1", label: "Platform" },
      { value: "All", label: "Updates" },
      { value: "Fast", label: "Feel" },
    ],
    lines: ["Shared context", "Unified timeline", "Cleaner day"],
  },
] as const;

function UnifiedFeaturePanel({
  index,
  progress,
  reduceMotion,
}: {
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const story = featureStories[index];
  const start = 0.16 + index * 0.18;
  const activeOpacity = useTransform(progress, [start - 0.08, start, start + 0.16, start + 0.3], [0.14, 1, 1, 0.18]);
  const titleY = useTransform(progress, [start - 0.08, start + 0.1], [reduceMotion ? 0 : 18, 0]);
  const titleScale = useTransform(progress, [start - 0.08, start + 0.12], [reduceMotion ? 1 : 0.96, 1]);
  const previewY = useTransform(progress, [start - 0.06, start + 0.12], [reduceMotion ? 0 : 28, 0]);
  const previewScale = useTransform(progress, [start - 0.06, start + 0.12], [reduceMotion ? 1 : 0.94, 1]);
  const glowOpacity = useTransform(progress, [start - 0.02, start + 0.14], [0.18, 1]);

  return (
    <motion.div style={{ opacity: activeOpacity }} className="contents">
      <motion.div
        style={{ y: titleY, scale: titleScale }}
        className="flex min-h-[14rem] items-center rounded-[2rem] border border-white/8 bg-white/[0.02] px-5 py-6 shadow-[0_18px_54px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:px-7"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/38">{story.eyebrow}</p>
          <h3 className="mt-4 text-balance font-display text-[clamp(2.4rem,5vw,5.6rem)] font-semibold tracking-[-0.08em] text-white">
            {story.label}
          </h3>
          <p className="mt-4 max-w-[28rem] text-[0.98rem] leading-7 text-white/54">{story.blurb}</p>
        </div>
      </motion.div>

      <motion.div
        style={{ y: previewY, scale: previewScale, opacity: activeOpacity }}
        className="relative overflow-hidden rounded-[2.4rem] border border-[#ffb3b8]/15 bg-[linear-gradient(135deg,rgba(112,5,17,0.98),rgba(176,18,36,0.92)_38%,rgba(230,82,92,0.82)_70%,rgba(255,143,134,0.62)_100%)] p-4 shadow-[0_36px_120px_rgba(120,8,20,0.36)] sm:p-5"
      >
        <motion.div
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_28%)]"
        />
        <div className="relative rounded-[1.9rem] border border-white/12 bg-black/18 p-4 backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/54">{story.eyebrow}</p>
              <p className="mt-3 max-w-[20rem] font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-0.08em] text-white">
                {story.label}
              </p>
            </div>
            <span className="inline-flex h-fit rounded-full border border-white/14 bg-white/[0.08] px-3 py-1 text-[11px] text-white/72">
              HawkLife
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {story.metrics.map((item) => (
              <div key={item.label} className="rounded-[1.3rem] border border-white/12 bg-white/[0.08] px-4 py-4">
                <p className="font-display text-[1.9rem] font-semibold tracking-[-0.06em] text-white">{item.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/52">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            {story.lines.map((item, itemIndex) => (
              <motion.div
                key={item}
                animate={{ opacity: [0.68, 1, 0.68] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: itemIndex * 0.18 }}
                className="rounded-[1rem] border border-white/12 bg-white/[0.08] px-4 py-3 text-[14px] text-white/82"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HeroScene() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.1, 0.28, 0.7, 0.9], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0.12, 0.7], [reduceMotion ? 1 : 0.96, 1]);
  const y = useTransform(scrollYProgress, [0.12, 0.7], [reduceMotion ? 0 : 34, 0]);

  return (
    <SceneFrame sceneRef={ref}>
      <motion.div style={{ opacity, scale, y }} className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">
        <div className="absolute inset-x-[12%] top-1/2 -z-10 h-56 -translate-y-1/2 rounded-full bg-white/[0.06] blur-[140px]" />
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.38em] text-white/48">
          HawkLife
        </p>
        <h1 className="max-w-5xl text-balance font-display text-[clamp(3rem,10vw,7.5rem)] font-semibold tracking-[-0.08em] text-white">
          This is HawkLife.
        </h1>
      </motion.div>
    </SceneFrame>
  );
}

function ProblemScene() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const wrapperOpacity = useTransform(scrollYProgress, [0.08, 0.18, 0.82, 0.95], [0, 1, 1, 0]);
  const wrapperScale = useTransform(scrollYProgress, [0.1, 0.85], [reduceMotion ? 1 : 0.985, 1]);
  const lines = [
    "School tools feel outdated.",
    "Disconnected.",
    "Slow.",
  ];

  return (
    <SceneFrame sceneRef={ref} className="-mt-[18svh]">
      <motion.div style={{ opacity: wrapperOpacity, scale: wrapperScale }} className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center">
        <div className="space-y-6 sm:space-y-8">
          {lines.map((line, index) => (
            <ProblemLine
              key={line}
              line={line}
              index={index}
              progress={scrollYProgress}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </motion.div>
    </SceneFrame>
  );
}

function TransitionScene() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.12, 0.28, 0.76, 0.92], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0.16, 0.78], [reduceMotion ? 1 : 0.95, 1]);
  const y = useTransform(scrollYProgress, [0.16, 0.35], [reduceMotion ? 0 : 28, 0]);

  return (
    <SceneFrame sceneRef={ref} className="-mt-[18svh]">
      <motion.div style={{ opacity, scale, y }} className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <div className="mb-8 h-px w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <h2 className="max-w-4xl text-balance font-display text-[clamp(2.6rem,8vw,6.5rem)] font-semibold tracking-[-0.08em] text-white">
          So we built something better.
        </h2>
      </motion.div>
    </SceneFrame>
  );
}

function FeaturesScene() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const panelOpacity = useTransform(scrollYProgress, [0.1, 0.22, 0.84, 0.96], [0, 1, 1, 0]);

  return (
    <SceneFrame sceneRef={ref} className="-mt-[16svh] min-h-[190svh]">
      <motion.div style={{ opacity: panelOpacity }} className="mx-auto grid w-full max-w-7xl gap-6 px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div className="max-w-md lg:sticky lg:top-24">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/44">Core system</p>
          <h2 className="text-balance font-display text-[clamp(2.2rem,5vw,4.6rem)] font-semibold tracking-[-0.08em] text-white">
            Each feature expands into focus.
          </h2>
          <p className="mt-5 text-balance text-[clamp(1rem,2vw,1.1rem)] leading-8 text-white/58">
            Minimal, cinematic, and clearer. The name leads, then the preview grows around it.
          </p>
        </div>

        <div className="grid gap-5">
          {featureStories.map((feature, index) => (
            <UnifiedFeaturePanel
              key={feature.label}
              index={index}
              progress={scrollYProgress}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </motion.div>
    </SceneFrame>
  );
}

function QrScene() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.1, 0.22, 0.84, 0.96], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0.18, 0.72], [reduceMotion ? 1 : 0.92, 1]);
  const rotate = useTransform(scrollYProgress, [0.18, 0.72], [reduceMotion ? 0 : -4, 0]);

  return (
    <SceneFrame sceneRef={ref} className="-mt-[14svh]">
      <motion.div style={{ opacity }} className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 text-center">
        <motion.div
          style={{ scale, rotate }}
          className="rounded-[2.5rem] border border-white/12 bg-white/[0.04] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.34)] backdrop-blur-xl"
        >
          <div className="grid grid-cols-9 gap-1 rounded-[1.5rem] bg-white p-4 shadow-[0_0_50px_rgba(255,255,255,0.08)] sm:p-5">
            {qrPattern.map((cell, index) => (
              <motion.span
                key={index}
                animate={{ opacity: cell ? [0.78, 1, 0.78] : 1 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.015, ease: "easeInOut" }}
                className={cn("aspect-square h-4 w-4 rounded-[4px] sm:h-5 sm:w-5", cell ? "bg-black" : "bg-transparent")}
              />
            ))}
          </div>
        </motion.div>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/44">QR attendance</p>
          <h2 className="text-balance font-display text-[clamp(2.4rem,7vw,5.8rem)] font-semibold tracking-[-0.08em] text-white">
            Real attendance. Instantly.
          </h2>
        </div>
      </motion.div>
    </SceneFrame>
  );
}

function MobileScene() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.1, 0.22, 0.84, 0.96], [0, 1, 1, 0]);
  const phoneY = useTransform(scrollYProgress, [0.16, 0.52], [reduceMotion ? 0 : 56, 0]);
  const phoneScale = useTransform(scrollYProgress, [0.16, 0.52], [reduceMotion ? 1 : 0.92, 1]);

  return (
    <SceneFrame sceneRef={ref} className="-mt-[14svh]">
      <motion.div style={{ opacity }} className="mx-auto grid w-full max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="order-2 max-w-xl text-center lg:order-1 lg:text-left">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/44">Mobile first</p>
          <h2 className="text-balance font-display text-[clamp(2.5rem,7vw,5.8rem)] font-semibold tracking-[-0.08em] text-white">
            Built for your phone.
          </h2>
          <p className="mt-5 text-[clamp(1rem,2vw,1.15rem)] leading-8 text-white/58">
            Fast to tap, easy to scan, and smooth enough to feel like it belongs in your pocket.
          </p>
        </div>

        <motion.div
          style={{ y: phoneY, scale: phoneScale }}
          className="order-1 mx-auto w-full max-w-[22rem] rounded-[2.8rem] border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-3 shadow-[0_40px_120px_rgba(0,0,0,0.34)] backdrop-blur-xl lg:order-2"
        >
          <div className="rounded-[2.2rem] border border-white/10 bg-black/85 px-4 pb-5 pt-4">
            <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-white/14" />
            <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/42">Today at The Prep</p>
              <p className="mt-3 font-display text-[1.7rem] font-semibold tracking-[-0.06em] text-white">
                Everything in one place
              </p>
              <div className="mt-5 space-y-3">
                {["Flex check-in", "Club announcements", "Calendar updates"].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0.7, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.08 }}
                    viewport={{ once: true, amount: 0.6 }}
                    className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/[0.04] px-4 py-3"
                  >
                    <span className="text-[0.95rem] text-white/82">{item}</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/72" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </SceneFrame>
  );
}

function ClosingScene() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.12, 0.3, 0.86], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0.16, 0.34], [reduceMotion ? 0 : 36, 0]);

  return (
    <SceneFrame sceneRef={ref} className="-mt-[16svh] min-h-[120svh]">
      <motion.div style={{ opacity, y }} className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">HawkLife</p>
        <h2 className="text-balance font-display text-[clamp(2.8rem,8vw,6.8rem)] font-semibold tracking-[-0.08em] text-white">
          Welcome to HawkLife.
        </h2>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white px-5 py-3 text-[13px] font-semibold text-black transition-transform duration-200 hover:scale-[1.02]"
          >
            Enter HawkLife
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-[12px] text-white/40">St. Joe&apos;s Prep, reimagined in motion.</span>
        </div>
      </motion.div>
    </SceneFrame>
  );
}

export function CinematicAbout() {
  return (
    <div className="bg-black text-white">
      <div className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-7">
          <BrandLogo href="/about" compact tone="inverse" />
          <Link
            href="/auth/signin"
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-medium text-white/72 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </div>

      <main className="relative overflow-x-hidden bg-black">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_24%),radial-gradient(circle_at_20%_35%,rgba(255,255,255,0.04),transparent_22%),linear-gradient(180deg,#000,#060606_35%,#000)]" />
        <HeroScene />
        <ProblemScene />
        <TransitionScene />
        <FeaturesScene />
        <QrScene />
        <MobileScene />
        <ClosingScene />
      </main>
    </div>
  );
}
