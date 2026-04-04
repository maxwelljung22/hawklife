"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { HeroPanel } from "./hero-panel";
import { AuthCard } from "./auth-card";

export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;
export const EASE_OUT    = [0.4, 0, 0.2, 1]      as const;

export type SignInState = "idle" | "loading" | "success" | "error";

export function HomePage() {
  const [signInState, setSignInState] = useState<SignInState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const shouldReduce = useReducedMotion();

  const handleSignIn = useCallback(async () => {
    if (signInState === "loading") return;
    setSignInState("loading");
    setErrorMessage("");
    try {
      const result = await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: false,
      });
      if (result?.error) {
        const msg =
          result.error === "DomainNotAllowed"
            ? "Only @sjprep.org and @sjprephawks.org accounts are allowed."
            : "Sign-in failed. Please try again.";
        setErrorMessage(msg);
        setSignInState("error");
        setTimeout(() => setSignInState("idle"), 4000);
      } else if (result?.url) {
        setSignInState("success");
        window.location.href = result.url;
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setSignInState("error");
      setTimeout(() => setSignInState("idle"), 4000);
    }
  }, [signInState]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: shouldReduce ? 0 : 0.3 } }}
      className="auth-page-bg min-h-screen overflow-hidden"
    >
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6 xl:flex-row xl:items-stretch xl:gap-6">
        <HeroPanel />
        <motion.section
          className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--background)/0.96),hsl(var(--muted)/0.9))] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10 xl:max-w-[430px]"
          initial={{ opacity: 0, x: shouldReduce ? 0 : 20 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
          aria-label="Sign in"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 20% 12%, hsl(var(--primary) / 0.10) 0%, transparent 60%)," +
                "radial-gradient(ellipse 60% 80% at 80% 80%, hsl(var(--accent) / 0.08) 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full">
            <AuthCard state={signInState} errorMessage={errorMessage} onSignIn={handleSignIn} />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.1, duration: 0.5 } }}
            className="absolute bottom-5 left-5 right-5 hidden items-center gap-3 lg:flex"
          >
            <div className="h-px w-5 bg-border" />
            <p className="text-[13px] italic font-light tracking-wide text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>
              &quot;Men for Others&quot; — St. Joseph&apos;s Preparatory School, 1851
            </p>
          </motion.div>
        </motion.section>
      </div>
    </motion.div>
  );
}
