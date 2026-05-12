"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { SignInState } from "./home-page";
import { BrandLogo } from "@/components/layout/brand-logo";

interface AuthCardProps {
  state: SignInState;
  errorMessage: string;
  onSignIn: () => void;
}

export function AuthCard({ state, errorMessage, onSignIn }: AuthCardProps) {
  const shouldReduce = useReducedMotion();
  const isLoading = state === "loading";
  const isSuccess = state === "success";

  return (
    <motion.div
      className="w-full max-w-[920px]"
      initial={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center text-center">
        <BrandLogo href="/" tone="inverse" className="justify-center" />

        <h1
          className="mt-12 text-balance text-[48px] font-semibold leading-none tracking-[-0.05em] text-white sm:text-[64px]"
          style={{ fontFamily: "Iowan Old Style, Georgia, serif" }}
        >
          Welcome to HawkLife
        </h1>

        <p className="mt-5 text-[18px] text-[#a5a7b7] sm:text-[22px]">
          St. Joseph&apos;s Preparatory School
        </p>

        <div
          className="mt-14 w-full rounded-[36px] border px-8 py-10 text-left shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:px-14 sm:py-16"
          style={{
            borderColor: "rgba(68,82,106,0.45)",
            background: "linear-gradient(180deg, rgba(24,29,39,0.96) 0%, rgba(20,24,32,0.94) 100%)",
          }}
        >
          <p className="mx-auto max-w-[670px] text-balance text-[20px] leading-[1.8] text-[#a7aab7] sm:text-[28px]">
            Sign in with your St. Joseph&apos;s Preparatory School Google account to continue into life at St. Joe&apos;s Prep.
          </p>

          {errorMessage ? (
            <p className="mx-auto mt-6 max-w-[670px] text-[14px] leading-6 text-[#ff8f8f]" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <motion.button
            onClick={onSignIn}
            disabled={isLoading || isSuccess}
            className="mx-auto mt-10 flex min-h-[74px] w-full max-w-[670px] items-center justify-center gap-5 rounded-[28px] px-8 text-[18px] font-semibold text-white sm:text-[20px]"
            style={{
              fontFamily: "var(--font-body)",
              opacity: isLoading || isSuccess ? 0.8 : 1,
              cursor: isLoading || isSuccess ? "not-allowed" : "pointer",
              background: "linear-gradient(90deg, #11151d 0%, #1a1f2b 100%)",
            }}
            whileHover={!isLoading && !isSuccess ? { scale: 1.01 } : undefined}
            whileTap={!isLoading && !isSuccess ? { scale: 0.985 } : undefined}
            aria-label="Sign in with Google"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <motion.div
                  className="h-5 w-5 rounded-full border-2"
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
                <svg className="flex-shrink-0" width="38" height="38" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </motion.button>
        </div>

        <p className="mt-12 text-center text-[18px] tracking-[0.02em] text-[#9697a3] sm:text-[22px]">
          Restricted to <span style={{ fontFamily: "var(--font-mono)" }}>@sjprep.org</span> and{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>@sjprephawks.org</span>
        </p>
      </div>
    </motion.div>
  );
}
