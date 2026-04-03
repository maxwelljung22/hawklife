"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const params  = useSearchParams();
  const error   = params.get("error");
  const messages: Record<string, string> = {
    DomainNotAllowed:   "Your email domain is not permitted. Only @sjprep.org and @sjprephawks.org accounts can sign in.",
    OAuthSignin:        "An error occurred during Google sign-in. Please try again.",
    OAuthCallback:      "Authentication callback failed. Please try again.",
    AccessDenied:       "Your account signed in, but it does not currently have permission to finish authentication.",
    default:            "An authentication error occurred.",
  };
  const message = messages[error ?? ""] ?? messages.default;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔒</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, marginBottom: 8 }}>Access Denied</h1>
        <p className="text-muted-foreground mb-6" style={{ fontSize: 14, lineHeight: 1.6 }}>{message}</p>
        <Link href="/auth/signin" className="inline-flex items-center px-5 py-2.5 text-white rounded-xl text-sm font-medium" style={{ background: "#8B1A1A", boxShadow: "0 4px 12px rgba(139,26,26,.25)" }}>
          Try Again
        </Link>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ErrorContent />
    </Suspense>
  );
}
