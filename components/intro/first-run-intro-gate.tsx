"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const INTRO_FEATURES = [
  "Flex Block",
  "Club Directory",
  "All-in-one Calendar",
  "Attendance",
  "Polls",
  "Announcements",
] as const;

const QR_PATTERN = [
  1, 1, 1, 0, 1, 1, 0, 1, 1,
  1, 0, 1, 0, 0, 1, 0, 0, 1,
  1, 1, 1, 0, 1, 1, 1, 0, 1,
  0, 0, 0, 1, 0, 0, 1, 0, 0,
  1, 1, 0, 0, 1, 1, 0, 1, 1,
  1, 0, 1, 0, 0, 1, 0, 0, 1,
  0, 1, 1, 1, 1, 0, 1, 1, 0,
  1, 0, 0, 0, 1, 0, 0, 1, 1,
  1, 1, 1, 0, 1, 1, 0, 1, 1,
] as const;

const INTRO_DURATION_MS = 31_000;
const FEATURE_DURATION_MS = 1_250;

type IntroSceneId =
  | "welcome"
  | "subtitle"
  | "features"
  | "qr"
  | "phone"
  | "final"
  | "start";

const INTRO_SCHEDULE: Array<{ id: IntroSceneId; at: number }> = [
  { id: "welcome", at: 0 },
  { id: "subtitle", at: 3_200 },
  { id: "features", at: 7_000 },
  { id: "qr", at: 13_800 },
  { id: "phone", at: 18_600 },
  { id: "final", at: 23_400 },
  { id: "start", at: 27_400 },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } },
};

const sceneVariants = {
  initial: { opacity: 0, y: 32, scale: 0.975, filter: "blur(12px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.05, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -24,
    scale: 1.02,
    filter: "blur(10px)",
    transition: { duration: 0.65, ease: [0.4, 0, 1, 1] },
  },
};

const FLOATING_ORBS = [
  { className: "-left-24 top-[-8%] h-[26rem] w-[26rem] bg-[#f97316]/20", x: [0, 48, -18, 0], y: [0, 36, 54, 0], scale: [1, 1.16, 1.08, 1] },
  { className: "right-[-10%] top-[12%] h-[30rem] w-[30rem] bg-[#38bdf8]/18", x: [0, -42, 18, 0], y: [0, 28, -32, 0], scale: [1, 1.08, 1.18, 1] },
  { className: "bottom-[-18%] left-[22%] h-[32rem] w-[32rem] bg-[#f43f5e]/16", x: [0, 30, -24, 0], y: [0, -36, 18, 0], scale: [1, 1.12, 1.04, 1] },
  { className: "bottom-[-14%] right-[10%] h-[24rem] w-[24rem] bg-[#fde047]/14", x: [0, -18, 24, 0], y: [0, -42, -14, 0], scale: [1, 1.1, 1.18, 1] },
] as const;

const STARS = [
  { left: "8%", top: "14%", size: "h-1.5 w-1.5", delay: 0.1 },
  { left: "18%", top: "72%", size: "h-1 w-1", delay: 0.8 },
  { left: "28%", top: "28%", size: "h-2 w-2", delay: 1.1 },
  { left: "38%", top: "58%", size: "h-1.5 w-1.5", delay: 0.4 },
  { left: "46%", top: "16%", size: "h-1 w-1", delay: 1.5 },
  { left: "58%", top: "76%", size: "h-1.5 w-1.5", delay: 0.9 },
  { left: "66%", top: "34%", size: "h-2 w-2", delay: 0.6 },
  { left: "78%", top: "22%", size: "h-1 w-1", delay: 1.3 },
  { left: "86%", top: "62%", size: "h-1.5 w-1.5", delay: 0.2 },
  { left: "92%", top: "40%", size: "h-1 w-1", delay: 1.7 },
] as const;

function IntroBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#04070d]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_24%),linear-gradient(135deg,rgba(8,15,32,0.94)_0%,rgba(4,7,13,0.94)_45%,rgba(18,10,28,0.94)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:120px_120px] opacity-[0.08] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />

      {FLOATING_ORBS.map((orb) => (
        <motion.div
          key={orb.className}
          animate={
            reduceMotion
              ? { opacity: 0.7 }
              : { x: orb.x, y: orb.y, scale: orb.scale, opacity: [0.5, 0.88, 0.62, 0.5] }
          }
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          className={cn("absolute rounded-full blur-[130px]", orb.className)}
        />
      ))}

      <motion.div
        animate={reduceMotion ? { opacity: 0.5 } : { opacity: [0.22, 0.4, 0.28], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-x-[14%] top-[10%] h-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_28%,transparent_72%)] blur-[100px]"
      />

      {STARS.map((star) => (
        <motion.span
          key={`${star.left}-${star.top}`}
          animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0.2, 0.9, 0.28], scale: [1, 1.5, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
          className={cn("absolute rounded-full bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.55)]", star.size)}
          style={{ left: star.left, top: star.top }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(4,7,13,0.7)_100%)]" />
    </div>
  );
}

function IntroSceneFrame({ children, align = "center" }: { children: ReactNode; align?: "center" | "split" }) {
  return (
    <motion.div
      variants={sceneVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "absolute inset-0 flex w-full items-center px-6 pb-14 pt-24 sm:px-10 sm:pb-16 sm:pt-28",
        align === "center" ? "justify-center text-center" : "justify-center"
      )}
    >
      {children}
    </motion.div>
  );
}

function WelcomeScene() {
  return (
    <IntroSceneFrame>
      <div className="space-y-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#f8c96d]/70">HawkLife</p>
        <h1 className="max-w-5xl text-balance font-display text-[clamp(3rem,10vw,7rem)] font-semibold tracking-[-0.08em] text-white">
          Welcome to HawkLife
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-base text-white/58 sm:text-lg">
          A calmer, brighter way to move through the school day.
        </p>
      </div>
    </IntroSceneFrame>
  );
}

function SubtitleScene() {
  return (
    <IntroSceneFrame>
      <div className="space-y-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7dd3fc]/70">HawkLife</p>
        <h2 className="max-w-4xl text-balance font-display text-[clamp(2.6rem,8vw,6rem)] font-semibold tracking-[-0.08em] text-white">
          Your school. Reimagined.
        </h2>
        <p className="mx-auto max-w-2xl text-balance text-base text-white/54 sm:text-lg">
          Every tool, update, and moment flows together in one beautiful place.
        </p>
      </div>
    </IntroSceneFrame>
  );
}

function FeaturesScene({ featureIndex }: { featureIndex: number }) {
  return (
    <IntroSceneFrame>
      <div className="relative flex w-full max-w-5xl flex-col items-center">
        <div className="absolute inset-x-[18%] top-1/2 -z-10 h-64 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(248,113,113,0.22),rgba(56,189,248,0.22),rgba(253,224,71,0.2))] blur-[150px]" />
        <p className="mb-10 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/40">Built around the day</p>
        <div className="relative min-h-[6rem] sm:min-h-[7.5rem]">
          <AnimatePresence mode="wait">
            <motion.h2
              key={INTRO_FEATURES[featureIndex]}
              initial={{ opacity: 0, y: 34, scale: 0.97, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, scale: 1.02, filter: "blur(8px)" }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[linear-gradient(135deg,#ffffff_0%,#fef3c7_30%,#bae6fd_68%,#fbcfe8_100%)] bg-clip-text text-balance font-display text-[clamp(2.5rem,8vw,6rem)] font-semibold tracking-[-0.08em] text-transparent"
            >
              {INTRO_FEATURES[featureIndex]}
            </motion.h2>
          </AnimatePresence>
        </div>
        <p className="mt-8 max-w-2xl text-balance text-white/52">
          Designed to feel less like software and more like your campus coming alive.
        </p>
      </div>
    </IntroSceneFrame>
  );
}

function QrScene() {
  return (
    <IntroSceneFrame>
      <div className="flex w-full max-w-3xl flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.84, rotateX: 18 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[2rem] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] p-4 shadow-[0_36px_100px_rgba(56,189,248,0.14)] backdrop-blur-xl sm:p-5"
        >
          <div className="grid grid-cols-9 gap-1 rounded-[1.35rem] bg-[linear-gradient(135deg,#ffffff_0%,#fefce8_100%)] p-4 sm:p-5">
            {QR_PATTERN.map((cell, index) => (
              <motion.span
                key={index}
                animate={{
                  opacity: cell ? [0.68, 1, 0.72] : 1,
                  scale: cell ? [1, 1.08, 1] : 1,
                  backgroundColor: cell ? ["#020617", "#0f172a", "#0369a1", "#020617"] : undefined,
                }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.028 }}
                className={cn("h-3.5 w-3.5 rounded-[4px] sm:h-5 sm:w-5", cell ? "bg-slate-950" : "bg-transparent")}
              />
            ))}
          </div>
        </motion.div>
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#7dd3fc]/72">Attendance</p>
        <h2 className="mt-4 max-w-3xl text-balance font-display text-[clamp(2.2rem,7vw,5.2rem)] font-semibold tracking-[-0.08em] text-white">
          Real attendance. Instantly.
        </h2>
        <p className="mt-5 max-w-2xl text-balance text-white/56">
          Crisp scans, quick check-ins, and a little glow to make the utility feel premium.
        </p>
      </div>
    </IntroSceneFrame>
  );
}

function PhoneScene() {
  return (
    <IntroSceneFrame>
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 text-center lg:order-1 lg:text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#fda4af]/72">Mobile first</p>
          <h2 className="mt-5 text-balance font-display text-[clamp(2.4rem,7vw,5.5rem)] font-semibold tracking-[-0.08em] text-white">
            Built for your phone.
          </h2>
          <p className="mt-5 max-w-xl text-balance text-white/56 lg:max-w-lg">
            Elegant enough for a launch video, practical enough for every announcement, flex check-in, and update.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 mx-auto w-full max-w-[18rem] rounded-[2.8rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05))] p-3 shadow-[0_42px_160px_rgba(244,63,94,0.12)] lg:order-2"
        >
          <div className="rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top,#1e293b_0%,#020617_72%)] px-4 pb-5 pt-4">
            <div className="mx-auto h-1.5 w-20 rounded-full bg-white/14" />
            <div className="mt-5 rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#f8c96d]/70">Today at Prep</p>
              <p className="mt-3 font-display text-[1.6rem] tracking-[-0.06em] text-white">Everything in one place</p>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Flex check-in", dot: "bg-amber-300" },
                  { label: "Club announcements", dot: "bg-sky-300" },
                  { label: "Calendar updates", dot: "bg-rose-300" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, delay: 0.24 + index * 0.16 }}
                    className="flex items-center justify-between rounded-[1.15rem] border border-white/8 bg-white/[0.05] px-4 py-3"
                  >
                    <span className="text-[0.94rem] text-white/84">{item.label}</span>
                    <span className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]", item.dot)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </IntroSceneFrame>
  );
}

function FinalScene() {
  return (
    <IntroSceneFrame>
      <div className="space-y-4">
        <h2 className="max-w-4xl bg-[linear-gradient(135deg,#ffffff_0%,#fde68a_34%,#7dd3fc_68%,#f9a8d4_100%)] bg-clip-text text-balance font-display text-[clamp(2.6rem,8vw,6.2rem)] font-semibold tracking-[-0.08em] text-transparent">
          Everything your school needs.
        </h2>
        <p className="text-balance font-display text-[clamp(2rem,6vw,4.5rem)] tracking-[-0.07em] text-white/72">
          All in one place.
        </p>
      </div>
    </IntroSceneFrame>
  );
}

function StartScene() {
  return (
    <IntroSceneFrame>
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f8c96d]/72">HawkLife</p>
        <h2 className="text-balance font-display text-[clamp(2.8rem,8vw,5.8rem)] font-semibold tracking-[-0.08em] text-white">
          Let&apos;s get started.
        </h2>
        <p className="mx-auto max-w-2xl text-balance text-white/56">
          Slower, softer, brighter. The product should feel as polished as the idea.
        </p>
      </div>
    </IntroSceneFrame>
  );
}

function IntroSequence({
  onDismiss,
  persistSeen,
}: {
  onDismiss: () => void;
  persistSeen: () => void;
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const [scene, setScene] = useState<IntroSceneId>("welcome");
  const [featureIndex, setFeatureIndex] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    for (const item of INTRO_SCHEDULE.slice(1)) {
      timers.push(setTimeout(() => setScene(item.id), reduceMotion ? Math.max(0, item.at * 0.55) : item.at));
    }

    const featureStart = reduceMotion ? 3_200 : 7_000;
    timers.push(
      setTimeout(() => {
        let current = 0;
        const interval = setInterval(() => {
          current += 1;
          setFeatureIndex((prev) => (prev < INTRO_FEATURES.length - 1 ? prev + 1 : prev));
          if (current >= INTRO_FEATURES.length - 1) {
            clearInterval(interval);
          }
        }, reduceMotion ? 600 : FEATURE_DURATION_MS);

        timers.push(interval);
      }, featureStart)
    );

    timers.push(
      setTimeout(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        persistSeen();
        onDismiss();
      }, reduceMotion ? 10_800 : INTRO_DURATION_MS)
    );

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
        clearInterval(timer);
      }
    };
  }, [onDismiss, persistSeen, reduceMotion]);

  const renderedScene = useMemo(() => {
    switch (scene) {
      case "welcome":
        return <WelcomeScene />;
      case "subtitle":
        return <SubtitleScene />;
      case "features":
        return <FeaturesScene featureIndex={featureIndex} />;
      case "qr":
        return <QrScene />;
      case "phone":
        return <PhoneScene />;
      case "final":
        return <FinalScene />;
      case "start":
        return <StartScene />;
      default:
        return null;
    }
  }, [featureIndex, scene]);

  const handleSkip = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    persistSeen();
    onDismiss();
  };

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[200] overflow-hidden bg-black text-white"
    >
      <IntroBackdrop reduceMotion={reduceMotion} />
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        onClick={handleSkip}
        className="absolute right-4 top-4 z-10 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md transition-colors hover:bg-white/[0.12] hover:text-white sm:right-8 sm:top-8"
      >
        Skip
      </motion.button>

      <AnimatePresence mode="wait">{renderedScene}</AnimatePresence>
    </motion.div>
  );
}

export function FirstRunIntroGate({
  children,
  userId,
  shouldShowInitially,
}: {
  children: ReactNode;
  userId: string;
  shouldShowInitially: boolean;
}) {
  const storageKey = `hawklife:intro-seen:${userId}`;
  const [shouldShow, setShouldShow] = useState(false);
  const [ready, setReady] = useState(false);
  const persistedRef = useRef(false);

  useEffect(() => {
    const storedValue = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    setShouldShow(shouldShowInitially && storedValue !== "true");
    setReady(true);
  }, [shouldShowInitially, storageKey]);

  useEffect(() => {
    if (!shouldShow) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [shouldShow]);

  const persistSeen = async () => {
    if (persistedRef.current) return;
    persistedRef.current = true;

    window.localStorage.setItem(storageKey, "true");

    try {
      await fetch("/api/intro/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Failed to persist intro completion", error);
    }
  };

  return (
    <>
      {children}
      {ready ? (
        <AnimatePresence>{shouldShow ? <IntroSequence onDismiss={() => setShouldShow(false)} persistSeen={persistSeen} /> : null}</AnimatePresence>
      ) : null}
    </>
  );
}
