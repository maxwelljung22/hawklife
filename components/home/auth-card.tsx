"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  const isError   = state === "error";
  const isSuccess = state === "success";

  return (
    <motion.div
      className="relative w-full max-w-[390px]"
      initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.94, y: shouldReduce ? 0 : 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.52, ease: [0.34, 1.56, 0.64, 1], delay: 0.38 }}
    >
      <div className="auth-card-surface relative w-full overflow-hidden rounded-[28px]">
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.14), transparent)" }}
          aria-hidden="true"
        />
        <div className="p-6 sm:p-8 lg:p-9">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center gap-4 py-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D7A4F, #3D9A62)", boxShadow: "0 8px 24px rgba(45,122,79,.3)" }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l5 5L21 7" /></svg>
                </div>
                <div>
                  <h3 className="mb-1 text-[22px] font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Signed in!</h3>
                  <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
                </div>
                <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-border">
                  <motion.div className="h-full" style={{ background: "linear-gradient(to right, #8B0F0F, #B89240)", borderRadius: 99 }} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.8, ease: "easeInOut" }} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}>
                <div className="mb-6 sm:mb-8">
                  <BrandLogo />
                </div>
                <h2 className="mb-1.5 text-[24px] font-semibold tracking-[-0.03em] text-foreground sm:text-[28px]" style={{ fontFamily: "var(--font-display)" }}>Welcome back to HawkLife.</h2>
                <p className="mb-6 max-w-[312px] text-sm leading-6 text-muted-foreground sm:mb-8">Sign in with your St. Joseph&apos;s Preparatory School Google account to pick up where life at The Prep left off.</p>
                <div className="auth-divider mb-6 h-px sm:mb-8" />

                <AnimatePresence>
                  {isError && errorMessage && (
                    <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.25 }} className="mb-4 flex items-start gap-2.5 rounded-xl border border-[hsl(var(--primary)/0.16)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-3" role="alert">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B0F0F" strokeWidth="1.4" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="7" cy="7" r="5.5" /><path d="M7 4.5v2.5M7 9v.5" /></svg>
                      <p className="text-[12.5px] leading-[1.4] text-[hsl(var(--primary))]">{errorMessage}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={onSignIn}
                  disabled={isLoading}
                  className="relative w-full h-[54px] rounded-2xl flex items-center justify-center gap-2.5 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #101114 0%, #1F2430 100%)", color: "#fff", border: "none", fontFamily: "var(--font-body)", fontSize: "14.5px", fontWeight: 500, cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 1px 0 rgba(255,255,255,.06) inset, 0 12px 28px rgba(16,17,20,.20)" }}
                  whileHover={!isLoading ? { y: -1.5, boxShadow: "0 16px 34px rgba(16,17,20,.24)" } : undefined}
                  whileTap={!isLoading ? { scale: 0.99 } : undefined}
                  aria-label="Sign in with Google"
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <motion.div className="w-4 h-4 border-2 rounded-full" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} />
                      <span style={{ opacity: 0.7 }}>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <svg className="relative z-10 flex-shrink-0" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                        <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                      </svg>
                      <span className="relative z-10">Continue with Google</span>
                    </>
                  )}
                </motion.button>

                <div className="auth-note mt-5 flex items-start gap-2.5 rounded-[14px] px-3.5 py-3">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A89D8E" strokeWidth="1.4" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="7" cy="7" r="5.5" /><path d="M7 6v3M7 4.5v.5" /></svg>
                  <p className="text-[12px] leading-[1.55] text-muted-foreground">
                    Restricted to <code className="rounded bg-[hsl(var(--primary)/0.08)] px-1 py-0.5 text-[11px] text-[hsl(var(--primary))]" style={{ fontFamily: "var(--font-mono)" }}>@sjprep.org</code> for faculty and <code className="rounded bg-[hsl(var(--primary)/0.08)] px-1 py-0.5 text-[11px] text-[hsl(var(--primary))]" style={{ fontFamily: "var(--font-mono)" }}>@sjprephawks.org</code> for students at St. Joe&apos;s Prep.
                  </p>
                </div>
                <div className="mt-6 border-t border-border pt-4 text-center sm:mt-7 sm:pt-5">
                  <p className="text-[12px] leading-[1.5] text-muted-foreground">By signing in, you agree to the platform&apos;s terms of use. Managed by St. Joseph&apos;s Preparatory School.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
