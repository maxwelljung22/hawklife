"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FLEX_BLOCK_LABEL } from "@/lib/flex-attendance";

type QrState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; qrValue: string; expiresAt: number; refreshSeconds: number };

async function fetchQrState(sessionId: string): Promise<QrState> {
  const response = await fetch(`/api/flex/qr?sessionId=${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    return { status: "error", message: data.error || "Couldn't refresh the QR code." };
  }

  const data = (await response.json()) as { qrValue: string; expiresAt: number; refreshSeconds: number };
  return {
    status: "ready",
    qrValue: data.qrValue,
    expiresAt: data.expiresAt,
    refreshSeconds: data.refreshSeconds,
  };
}

export function QrDisplay({
  sessionId,
  title,
  subtitle,
  typeLabel,
}: {
  sessionId: string;
  title: string;
  subtitle: string;
  typeLabel: string;
}) {
  const [state, setState] = useState<QrState>({ status: "loading" });
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      const next = await fetchQrState(sessionId);
      if (!active) return;
      setState(next);

      if (next.status === "ready") {
        if (interval) clearInterval(interval);
        interval = setInterval(() => {
          setTick(Date.now());
        }, 1000);
      }
    };

    void load();
    const refresh = setInterval(load, 30000);

    return () => {
      active = false;
      clearInterval(refresh);
      if (interval) clearInterval(interval);
    };
  }, [sessionId]);

  const secondsRemaining = useMemo(() => {
    if (state.status !== "ready") return 0;
    return Math.max(0, Math.ceil((state.expiresAt - tick) / 1000));
  }, [state, tick]);

  useEffect(() => {
    if (state.status !== "ready") return;
    if (secondsRemaining <= 1) {
      void (async () => {
        setState({ status: "loading" });
        setState(await fetchQrState(sessionId));
      })();
    }
  }, [secondsRemaining, sessionId, state]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
    >
      <section className="surface-panel rounded-[34px] p-6 text-center sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{typeLabel}</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-foreground sm:text-[3.4rem]">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-[15px]">{subtitle}</p>
        <div className="mt-4 inline-flex items-center rounded-full border border-border bg-background/80 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
          {FLEX_BLOCK_LABEL}
        </div>
      </section>

      <section className="surface-card rounded-[34px] p-5 sm:p-8">
        <AnimatePresence mode="wait">
          {state.status === "loading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="skeleton h-[280px] w-[280px] rounded-[32px]" />
              <p className="text-sm text-muted-foreground">Refreshing the live attendance code…</p>
            </motion.div>
          ) : state.status === "error" ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 text-center"
            >
              <p className="text-base font-semibold text-foreground">Couldn&apos;t load the QR code</p>
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <Button onClick={async () => setState(await fetchQrState(sessionId))}>Try again</Button>
            </motion.div>
          ) : (
            <motion.div
              key={state.qrValue}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="rounded-[34px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(15,23,42,0.10)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(state.qrValue)}`}
                  alt={`QR code for ${title}`}
                  className="h-[260px] w-[260px] rounded-[20px] object-cover sm:h-[320px] sm:w-[320px]"
                />
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Refreshes in {secondsRemaining}s
                </div>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  This code refreshes automatically to protect attendance integrity and reduce screenshot reuse.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary)/0.08)] px-3 py-1.5 text-[12px] font-medium text-[hsl(var(--primary))]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Live flex attendance
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
}
