"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { SignInState } from "./home-page";
import { BrandLogo } from "@/components/layout/brand-logo";

interface AuthCardProps {
  state:        SignInState;
  errorMessage: string;
  onSignIn:     () => void;
}

export function AuthCard({ state, errorMessage, onSignIn }: AuthCardProps) {
  const shouldReduce = useReducedMotion();
  const isLoading = state === "loading";
  const isSuccess = state === "success";

  return (
    <motion.div
      className="w-full max-w-[280px]"
      initial={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center text-center">
        <BrandLogo href="/" compact />

        {errorMessage ? (
          <p className="mt-6 text-center text-[12px] leading-5 text-[hsl(var(--primary))]" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <motion.button
          onClick={onSignIn}
          disabled={isLoading || isSuccess}
          className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
          style={{ fontFamily: "var(--font-body)", opacity: isLoading || isSuccess ? 0.8 : 1, cursor: isLoading || isSuccess ? "not-allowed" : "pointer" }}
          whileHover={!isLoading && !isSuccess ? { scale: 1.01 } : undefined}
          whileTap={!isLoading && !isSuccess ? { scale: 0.985 } : undefined}
          aria-label="Sign in with Google"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <motion.div
                className="h-4 w-4 rounded-full border-2"
                style={{ borderColor: "rgba(255,255,255,.35)", borderTopColor: "#fff" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
              />
              <span>Signing in</span>
            </>
          ) : isSuccess ? (
            <span>Redirecting</span>
          ) : (
            <>
              <svg className="flex-shrink-0" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              <span>Login</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
