"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FLEX_BLOCK_LABEL } from "@/lib/flex-attendance";

type QrState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; qrValue: string; expiresAt: number | null; refreshSeconds: number | null; mode: "rotating" | "static" };

async function fetchQrState(sessionId: string, mode: "rotating" | "static"): Promise<QrState> {
  const response = await fetch(`/api/flex/qr?sessionId=${encodeURIComponent(sessionId)}&mode=${mode}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    return { status: "error", message: data.error || "Couldn't refresh the QR code." };
  }

  const data = (await response.json()) as { qrValue: string; expiresAt: number | null; refreshSeconds: number | null; mode?: "rotating" | "static" };
  return {
    status: "ready",
    qrValue: data.qrValue,
    expiresAt: data.expiresAt,
    refreshSeconds: data.refreshSeconds,
    mode: data.mode === "static" ? "static" : "rotating",
  };
}

function buildQrImageUrl(qrValue: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=${encodeURIComponent(qrValue)}`;
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
  const [keepSameQr, setKeepSameQr] = useState(false);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      const next = await fetchQrState(sessionId, keepSameQr ? "static" : "rotating");
      if (!active) return;
      setState(next);

      if (next.status === "ready" && next.mode !== "static") {
        if (interval) clearInterval(interval);
        interval = setInterval(() => {
          setTick(Date.now());
        }, 1000);
      }
    };

    void load();
    const refresh = keepSameQr ? null : setInterval(load, 30000);

    return () => {
      active = false;
      if (refresh) clearInterval(refresh);
      if (interval) clearInterval(interval);
    };
  }, [keepSameQr, sessionId]);

  const secondsRemaining = useMemo(() => {
    if (state.status !== "ready") return 0;
    if (state.expiresAt === null) return 0;
    return Math.max(0, Math.ceil((state.expiresAt - tick) / 1000));
  }, [state, tick]);

  const printQrPoster = async () => {
    const printableState =
      state.status === "ready" && state.mode === "static" ? state : await fetchQrState(sessionId, "static");

    if (printableState.status !== "ready") {
      setState(printableState);
      return;
    }

    setKeepSameQr(true);
    setState(printableState);

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=1200");
    if (!printWindow) return;

    const qrImageUrl = buildQrImageUrl(printableState.qrValue);
    const logoUrl = `${window.location.origin}/hawklife-hawk.png`;
    const escapedTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const escapedType = typeLabel.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${escapedTitle} QR Poster</title>
    <meta charset="utf-8" />
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: "Satoshi", "Avenir Next", "Segoe UI", Inter, sans-serif;
        background: #f8f4ef;
        color: #161311;
      }
      .sheet {
        min-height: 100vh;
        padding: 40px;
        background:
          radial-gradient(circle at top right, rgba(184, 146, 64, 0.18), transparent 34%),
          radial-gradient(circle at bottom left, rgba(139, 26, 26, 0.14), transparent 32%),
          #f8f4ef;
      }
      .card {
        max-width: 820px;
        margin: 0 auto;
        border-radius: 36px;
        background: white;
        border: 1px solid rgba(139, 26, 26, 0.12);
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
        overflow: hidden;
      }
      .top {
        padding: 36px 40px 20px;
        background: linear-gradient(135deg, rgba(139, 26, 26, 0.1), rgba(184, 146, 64, 0.08));
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .brand img {
        width: 72px;
        height: 72px;
        object-fit: contain;
      }
      .brand-mark {
        font-size: 34px;
        font-weight: 700;
        letter-spacing: -0.06em;
        line-height: 1;
      }
      .brand-mark .life {
        color: #8b1a1a;
      }
      .brand-sub {
        margin-top: 4px;
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #7b6f67;
        font-weight: 700;
      }
      .eyebrow {
        margin: 28px 0 0;
        font-size: 12px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #8b1a1a;
        font-weight: 700;
      }
      .title {
        margin: 10px 0 0;
        font-family: "Iowan Old Style", Georgia, serif;
        font-size: 48px;
        letter-spacing: -0.06em;
        line-height: 1.02;
      }
      .meta {
        margin-top: 16px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-radius: 999px;
        border: 1px solid rgba(22, 19, 17, 0.1);
        background: rgba(255, 255, 255, 0.9);
        font-size: 13px;
        font-weight: 600;
        color: #5b514b;
      }
      .content {
        padding: 28px 40px 40px;
        text-align: center;
      }
      .qr-shell {
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        padding: 22px;
        border-radius: 32px;
        background: #fff;
        border: 1px solid rgba(22, 19, 17, 0.08);
        box-shadow: 0 18px 52px rgba(15, 23, 42, 0.08);
      }
      .qr-shell img {
        display: block;
        width: 100%;
        height: auto;
      }
      .note {
        margin: 24px auto 0;
        max-width: 520px;
        font-size: 15px;
        line-height: 1.6;
        color: #5f5650;
      }
      .footer {
        margin-top: 28px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(139, 26, 26, 0.08);
        color: #8b1a1a;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      @page {
        size: letter portrait;
        margin: 0.45in;
      }
      @media print {
        body {
          background: white;
        }
        .sheet {
          padding: 0;
          background: white;
        }
        .card {
          box-shadow: none;
          border: 1px solid rgba(22, 19, 17, 0.12);
        }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <section class="card">
        <div class="top">
          <div class="brand">
            <img src="${logoUrl}" alt="HawkLife logo" />
            <div>
              <div class="brand-mark">Hawk<span class="life">Life</span></div>
              <div class="brand-sub">St. Joseph's Preparatory School</div>
            </div>
          </div>
          <p class="eyebrow">${escapedType} Attendance</p>
          <h1 class="title">${escapedTitle}</h1>
          <div class="meta">${FLEX_BLOCK_LABEL} · Static QR for room display</div>
        </div>
        <div class="content">
          <div class="qr-shell">
            <img src="${qrImageUrl}" alt="QR code for ${escapedTitle}" />
          </div>
          <p class="note">Students should open HawkLife, join the correct flex block, and then scan this code when they arrive.</p>
          <div class="footer">Live HawkLife Attendance</div>
        </div>
      </section>
    </main>
  </body>
</html>`);
    printWindow.document.close();

    const finalizePrint = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    printWindow.onload = () => {
      setTimeout(finalizePrint, 250);
    };
  };

  useEffect(() => {
    if (state.status !== "ready") return;
    if (state.mode === "static") return;
    if (secondsRemaining <= 1) {
      void (async () => {
        setState({ status: "loading" });
        setState(await fetchQrState(sessionId, "rotating"));
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 rounded-full border border-border bg-muted/60 px-4 py-2 text-[12px] font-medium text-foreground">
            <input
              type="checkbox"
              checked={keepSameQr}
              onChange={(event) => setKeepSameQr(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Keep same QR code for printing
          </label>
          <Button variant="secondary" onClick={() => void printQrPoster()}>
            <Printer className="h-4 w-4" />
            Print QR
          </Button>
        </div>
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
              <Button onClick={async () => setState(await fetchQrState(sessionId, keepSameQr ? "static" : "rotating"))}>Try again</Button>
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
                  src={buildQrImageUrl(state.qrValue)}
                  alt={`QR code for ${title}`}
                  className="h-[260px] w-[260px] rounded-[20px] object-cover sm:h-[320px] sm:w-[320px]"
                />
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {state.mode === "static" ? "Static QR code" : `Refreshes in ${secondsRemaining}s`}
                </div>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  {state.mode === "static"
                    ? "This fixed QR code is easier to print and leave in the room, while still using a signed HawkLife session payload."
                    : "This code refreshes automatically to protect attendance integrity and reduce screenshot reuse."}
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
