"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";

function SignInContent() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const error = params.get("error");

  return (
    <div className="auth-page-bg min-h-screen flex items-center justify-center px-4 py-6 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center">
          <BrandLogo href="/" />
          <div className="mt-10 w-full rounded-[24px] border border-border/80 bg-background/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur">
            {error && (
              <div className="mb-4 rounded-2xl border border-[hsl(var(--primary)/0.16)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-3 text-left">
                <p className="text-[13px] leading-[1.5] text-[hsl(var(--primary))]">
                  {error === "DomainNotAllowed"
                    ? "Only @sjprep.org and @sjprephawks.org accounts are allowed."
                    : "An error occurred. Please try again."}
                </p>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => signIn("google", { callbackUrl })}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                minHeight: 54,
                padding: "14px 20px",
                background: "#111318",
                color: "#fff",
                border: "none",
                borderRadius: 18,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <svg viewBox="0 0 24 24" style={{ height: 20, width: 20, flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Log in with Google
            </motion.button>

            <p className="mt-4 text-center text-[11.5px] leading-[1.6] text-muted-foreground">
              Restricted to <span style={{ fontFamily: "var(--font-mono)" }}>@sjprep.org</span> and{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>@sjprephawks.org</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-page-bg min-h-screen" />}>
      <SignInContent />
    </Suspense>
  );
}
