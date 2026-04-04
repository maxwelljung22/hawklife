"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Lock, Mail, Sparkles, Waves, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoonLock({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
    >
      <section className="relative overflow-hidden rounded-[34px] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(176,18,36,0.12),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(230,82,92,0.10),transparent_22%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--card)/0.92))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-70">
          <div className="absolute left-[-8%] top-[-12%] h-48 w-48 rounded-full bg-[rgba(176,18,36,0.18)] blur-3xl" />
          <div className="absolute right-[-4%] top-[18%] h-40 w-40 rounded-full bg-[rgba(255,143,111,0.18)] blur-3xl" />
          <div className="absolute bottom-[-10%] left-[32%] h-52 w-52 rounded-full bg-[rgba(184,146,64,0.14)] blur-3xl" />
        </div>

        <div className="relative grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              {eyebrow}
            </div>

            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.07em] text-foreground sm:text-[3.6rem]">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-balance text-sm leading-7 text-muted-foreground sm:text-[15px]">
              {description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="mailto:maxwell.jung.2027@sjprephawks.org" className="inline-flex">
                <Button size="lg" className="min-w-[220px]">
                  <Mail className="h-4 w-4" />
                  Contact Maxwell
                </Button>
              </a>
              <div className="inline-flex h-12 items-center rounded-2xl border border-border bg-background/75 px-4 text-sm font-medium text-muted-foreground backdrop-blur">
                HawkLife v4.0.0
              </div>
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-[30px] border border-white/10 bg-[#080b12] p-5 shadow-[0_26px_70px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_20%),radial-gradient(circle_at_80%_20%,rgba(118,80,255,0.18),transparent_24%),linear-gradient(180deg,#080b12_0%,#0d111d_100%)]" />
            <motion.div
              aria-hidden="true"
              className="absolute left-1/2 top-10 h-48 w-48 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,93,115,0.38),transparent_65%)] blur-3xl"
              animate={reduceMotion ? {} : { scale: [1, 1.06, 0.98, 1], opacity: [0.8, 1, 0.86, 0.8] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                <span>Preview locked</span>
                <span>v4.0.0</span>
              </div>

              <div className="my-6 space-y-4">
                <motion.div
                  animate={reduceMotion ? {} : { y: [0, -4, 0] }}
                  transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] text-white">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/64">
                      Private preview
                    </span>
                  </div>
                  <p className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-white">Flex is cooking.</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    We&apos;re polishing attendance, sessions, and mobile interactions before the full HawkLife v4.0.0 release.
                  </p>
                </motion.div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: Zap,
                      title: "Sharper experience",
                      body: "Smoother transitions, faster joins, and cleaner control for the flex block flow.",
                    },
                    {
                      icon: Waves,
                      title: "More polished rollout",
                      body: "A more deliberate release with a stronger mobile-first interface and tighter admin tools.",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: 0.08 + index * 0.06 }}
                      whileHover={reduceMotion ? undefined : { y: -3 }}
                      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-white/86">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <p className="mt-4 text-sm font-semibold tracking-[-0.03em] text-white">{item.title}</p>
                      <p className="mt-2 text-[12.5px] leading-6 text-white/56">{item.body}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/62">
                Contact <span className="font-semibold text-white/88">maxwell.jung.2027@sjprephawks.org</span> for questions.
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
