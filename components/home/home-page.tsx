"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
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
      className="flex min-h-screen items-center justify-center px-4 py-6"
      style={{
        background:
          "radial-gradient(circle at top, rgba(98,36,43,0.18), transparent 32%), linear-gradient(180deg, #22191d 0%, #21191c 100%)",
      }}
    >
      <AuthCard state={signInState} errorMessage={errorMessage} onSignIn={handleSignIn} />
    </motion.div>
  );
}
