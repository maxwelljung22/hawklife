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
    previewTitle: "Available right now",
    previewItems: ["Library Commons", "Physics Lab", "College Center"],
    metrics: [
      { value: "2:05", label: "Starts" },
      { value: "18", label: "Sessions" },
      { value: "1 tap", label: "Join" },
    ],
    lines: ["Live capacity", "Instant join", "Clear rooms"],
    accent: "from-[#8a1f2d]/90 via-[#b83346]/70 to-[#f1a1ab]/40",
  },
  {
    label: "Clubs",
    eyebrow: "Club life",
    blurb: "Every club finally has a real home.",
    previewTitle: "This week in clubs",
    previewItems: ["Robotics build night", "Campus ministry update", "Mock trial agenda"],
    metrics: [
      { value: "12", label: "Active clubs" },
      { value: "4", label: "Posts today" },
      { value: "3", label: "Events next" },
    ],
    lines: ["Club updates", "Resources", "Member view"],
    accent: "from-[#7b2035]/90 via-[#c75d57]/72 to-[#f0c58b]/36",
  },
  {
    label: "Attendance",
    eyebrow: "Verified",
    blurb: "Attendance that feels immediate and real.",
    previewTitle: "Check-in status",
    previewItems: ["QR recognized", "Marked on time", "Roster updated live"],
    metrics: [
      { value: "QR", label: "Check-in" },
      { value: "Live", label: "Status" },
      { value: "0 lag", label: "Feedback" },
    ],
    lines: ["Scan quickly", "Mark late", "Track instantly"],
    accent: "from-[#6c1224]/92 via-[#db4a57]/70 to-[#ffd0c4]/42",
  },
] as const;

const connectedStory = {
  eyebrow: "Core system",
  label: "Everything connected",
  blurb: "One system for the rhythm of the Prep.",
  lines: ["Shared context", "Unified timeline", "Cleaner day"],
} as const;

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
  const nextStart = 0.16 + (index + 1) * 0.18;
  const fadeOutStart = index === featureStories.length - 1 ? start + 0.18 : nextStart - 0.04;
  const fadeOutEnd = index === featureStories.length - 1 ? start + 0.28 : nextStart + 0.05;
  const activeOpacity = useTransform(progress, [start - 0.08, start, fadeOutStart, fadeOutEnd], [0.08, 1, 1, 0]);
  const cardY = useTransform(progress, [start - 0.08, start + 0.1], [reduceMotion ? 0 : 18, 0]);
  const cardScale = useTransform(progress, [start - 0.08, start + 0.12], [reduceMotion ? 1 : 0.96, 1]);
  const headerOpacity = useTransform(progress, [start - 0.04, start + 0.08], [0.3, 1]);
  const previewOpacity = useTransform(progress, [start + 0.02, start + 0.16], [0.2, 1]);
  const previewX = useTransform(progress, [start - 0.04, start + 0.12], [reduceMotion ? 0 : 22, 0]);

  return (
    <motion.div style={{ opacity: activeOpacity, y: cardY, scale: cardScale }} className="relative min-h-[38rem]">
      <div className="absolute inset-0 rounded-[2.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] shadow-[0_28px_90px_rgba(0,0,0,0.28)]" />
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-44 rounded-t-[2.6rem] bg-gradient-to-r opacity-90 blur-3xl", story.accent)} />

      <div className="relative grid min-h-[38rem] gap-7 overflow-hidden rounded-[2.6rem] border border-white/10 bg-black/[0.72] p-5 backdrop-blur-xl sm:p-7 lg:grid-cols-[0.88fr_1.12fr] lg:gap-9 lg:p-8">
        <motion.div style={{ opacity: headerOpacity }} className="flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">{story.eyebrow}</p>
            <h3 className="mt-4 max-w-[10ch] text-balance font-display text-[clamp(2.6rem,5.2vw,5rem)] font-semibold tracking-[-0.09em] text-white">
              {story.label}
            </h3>
            <p className="mt-4 max-w-[22rem] text-[0.98rem] leading-7 text-white/58">{story.blurb}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {story.metrics.map((item, itemIndex) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-[1.2rem] border border-white/10 bg-white/[0.045] px-4 py-4 text-center sm:text-left",
                  itemIndex === story.metrics.length - 1 && "col-span-2 sm:col-span-1"
                )}
              >
                <p className="font-display text-[1.55rem] font-semibold tracking-[-0.06em] text-white sm:text-[1.72rem]">{item.value}</p>
                <p className="mt-1 text-[11px] tracking-[-0.01em] text-white/50">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div style={{ opacity: previewOpacity, x: previewX }} className="relative min-w-0">
          <div className="absolute inset-0 rounded-[2.1rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
          <div className="relative flex h-full min-h-[20rem] flex-col rounded-[2.1rem] border border-white/10 bg-[#090909]/90 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-3">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Live preview</p>
                <p className="mt-2 text-balance font-display text-[1.3rem] tracking-[-0.05em] text-white sm:text-[1.5rem]">{story.previewTitle}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
              </div>
            </div>

            <div className="mt-4 flex-1 space-y-3">
              {story.previewItems.map((item, itemIndex) => (
                <motion.div
                  key={item}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0.45, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: itemIndex * 0.08 }}
                  viewport={{ once: true, amount: 0.55 }}
                  className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.04] px-3 py-3.5 sm:px-4 sm:py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-r", story.accent)} />
                    <span className="text-[0.92rem] leading-6 text-white/84 sm:text-[0.98rem]">{item}</span>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/52 sm:px-3 sm:text-[11px]">
                    Live
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {story.lines.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/56 sm:px-3 sm:py-2 sm:text-[11px]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
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
    <SceneFrame sceneRef={ref} className="-mt-[10svh] min-h-[210svh]">
      <motion.div style={{ opacity: panelOpacity }} className="mx-auto grid w-full max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
        <div className="max-w-md lg:sticky lg:top-24">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/44">Core system</p>
          <h2 className="text-balance font-display text-[clamp(2.2rem,5vw,4.6rem)] font-semibold tracking-[-0.08em] text-white">
            Features come into view.
          </h2>
          <p className="mt-5 text-balance text-[clamp(1rem,2vw,1.1rem)] leading-8 text-white/58">
            Cleaner, sharper, and more cinematic. The title lands first, then the experience opens around it.
          </p>
        </div>

        <div className="grid gap-8 sm:gap-10">
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

function ConnectedScene() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.14, 0.28, 0.78, 0.92], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.16, 0.34], [reduceMotion ? 0 : 36, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0.22, 0.42], [0.2, 1]);

  return (
    <SceneFrame sceneRef={ref} className="min-h-[180svh]">
      <motion.div style={{ opacity, y }} className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">
        <div className="absolute inset-x-[18%] top-1/2 -z-10 h-64 -translate-y-1/2 rounded-full bg-[#7d1828]/18 blur-[150px]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/38">{connectedStory.eyebrow}</p>
        <motion.h2
          style={{ opacity: titleOpacity }}
          className="mt-6 max-w-4xl text-balance font-display text-[clamp(3.2rem,9vw,7.2rem)] font-semibold tracking-[-0.1em] text-white"
        >
          {connectedStory.label}
        </motion.h2>
        <p className="mt-6 max-w-2xl text-[clamp(1.02rem,2vw,1.18rem)] leading-8 text-white/56">
          {connectedStory.blurb}
        </p>
        <div className="mt-16 space-y-6 sm:mt-20">
          {connectedStory.lines.map((item, itemIndex) => (
            <motion.p
              key={item}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: itemIndex * 0.12 }}
              viewport={{ once: true, amount: 0.6 }}
              className="font-display text-[clamp(1.85rem,4vw,3.4rem)] tracking-[-0.08em] text-white/72"
            >
              {item}
            </motion.p>
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
    <SceneFrame sceneRef={ref} className="min-h-[150svh]">
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
            Built for you.
          </h2>
          <p className="mt-5 text-[clamp(1rem,2vw,1.15rem)] leading-8 text-white/58">
            Fast to tap, easy to scan, and smooth enough to feel natural everywhere you use it.
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
        <ConnectedScene />
        <QrScene />
        <MobileScene />
        <ClosingScene />
      </main>
    </div>
  );
}
