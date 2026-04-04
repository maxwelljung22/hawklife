"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, QrCode, ScanLine, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { scanIntoFlexSession } from "@/app/(app)/flex/actions";
import { FLEX_BLOCK_LABEL } from "@/lib/flex-attendance";

type ScanState =
  | { type: "idle" }
  | { type: "success"; title: string; status: string }
  | { type: "error"; message: string };

type DetectableBarcode = {
  rawValue?: string;
};

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [manualValue, setManualValue] = useState("");
  const [scanState, setScanState] = useState<ScanState>({ type: "idle" });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleScan = useCallback(async (value: string) => {
    const result = await scanIntoFlexSession(value);

    if ("error" in result) {
      const message = result.error || "That QR code could not be verified.";
      setScanState({ type: "error", message });
      toast({
        title: "Attendance not recorded",
        description: message,
        variant: "destructive",
      });
      return false;
    }

    setScanState({
      type: "success",
      title: result.title,
      status: result.status,
    });
    toast({
      title: result.status === "LATE" ? "Checked in late" : "Attendance recorded",
      description: `${result.title} marked as ${result.status.toLowerCase()}.`,
    });
    return true;
  }, [toast]);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraSupported(false);
        return;
      }

      const BarcodeDetectorCtor = (window as typeof window & { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: ImageBitmapSource) => Promise<DetectableBarcode[]> } }).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setCameraSupported(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (!mounted) return;
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);

        const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

        const tick = async () => {
          if (!mounted || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = window.requestAnimationFrame(tick);
            return;
          }

          try {
            const codes = await detector.detect(videoRef.current);
            const qrCode = codes.find((code) => typeof code.rawValue === "string" && code.rawValue.trim().length > 0);
            if (qrCode?.rawValue) {
              const success = await handleScan(qrCode.rawValue);
              if (success) return;
            }
          } catch {
            // Ignore intermittent detector errors and keep scanning.
          }

          rafRef.current = window.requestAnimationFrame(tick);
        };

        rafRef.current = window.requestAnimationFrame(tick);
      } catch {
        setCameraSupported(false);
      }
    };

    void startCamera();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [handleScan]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      <section className="surface-panel rounded-[32px] p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Camera check-in</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-foreground sm:text-[3.4rem]">Scan flex attendance</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
          Open the session QR on the host screen, scan it here, and your attendance is marked instantly for today&apos;s
          {` ${FLEX_BLOCK_LABEL}`} block.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-card overflow-hidden rounded-[32px] p-5 sm:p-6">
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-neutral-950">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_38%)]" />
            <video ref={videoRef} playsInline muted className="aspect-[4/5] w-full object-cover sm:aspect-[16/10]" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-[70%] w-[70%] max-w-[22rem] items-center justify-center rounded-[32px] border border-white/40">
                <div className="h-[72%] w-[72%] rounded-[26px] border border-dashed border-white/40" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-[24px] border border-border bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{cameraReady ? "Camera ready" : "Preparing camera"}</p>
              <p className="text-xs text-muted-foreground">
                {cameraSupported ? "Point your phone at the session QR code." : "Camera scanning isn't available on this device."}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background">
              <Camera className="h-5 w-5 text-foreground" />
            </div>
          </div>
        </section>

        <section className="surface-card rounded-[32px] p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {scanState.type === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex h-full flex-col items-center justify-center gap-5 py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
                >
                  <CheckCircle2 className="h-10 w-10" />
                </motion.div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Attendance recorded</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">{scanState.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">You&apos;re marked as {scanState.status.toLowerCase()}.</p>
                </div>
                <Button variant="secondary" onClick={() => setScanState({ type: "idle" })}>
                  Scan another code
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="rounded-[28px] border border-border bg-muted/45 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background">
                      <ScanLine className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Live scanning</p>
                      <p className="text-xs text-muted-foreground">
                        Works best on mobile Safari and Chrome with the rear camera.
                      </p>
                    </div>
                  </div>
                </div>

                {scanState.type === "error" ? (
                  <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                    <div className="flex items-start gap-3">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{scanState.message}</span>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Manual fallback
                  </label>
                  <Input
                    value={manualValue}
                    onChange={(event) => setManualValue(event.target.value)}
                    placeholder="Paste a session QR value"
                    className="h-12"
                  />
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() =>
                      startTransition(async () => {
                        await handleScan(manualValue);
                      })
                    }
                    disabled={isPending || !manualValue.trim()}
                  >
                    <QrCode className="h-4 w-4" />
                    Verify attendance
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  );
}
