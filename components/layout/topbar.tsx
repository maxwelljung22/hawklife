"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Search, Bell, Sun, Moon, Sparkles, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "./brand-logo";
import type { ShellUser } from "./sidebar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/about":         "About HawkLife",
  "/clubs":         "Club Directory",
  "/calendar":      "Calendar",
  "/flex":          "Flex Block",
  "/scan":          "Scan QR",
  "/announcements": "Announcements",
  "/voting":        "Polls & Elections",
  "/applications":  "Applications",
  "/charter/apply": "New Charter",
  "/nhs":           "NHS Hours",
  "/admin":         "Admin Panel",
  "/admin/charters": "Charter Reviews",
  "/faculty/create-session": "Create Session",
  "/club":          "Attendance QR",
  "/profile":       "Profile",
  "/profile/settings": "Settings",
};

interface TopbarProps {
  user: ShellUser["user"];
  onToggleSidebar: () => void;
  unreadNotifications: number;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string | Date;
    type: string;
    refId?: string | null;
    refType?: string | null;
    isRead: boolean;
  }>;
}

export function Topbar({ user, onToggleSidebar, unreadNotifications, notifications }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!notifOpen) return;
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [notifOpen]);

  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ??
    "HawkLife";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 flex min-h-[68px] items-center justify-between gap-2 border-b px-3.5 sm:min-h-[72px] sm:gap-3 sm:px-6 lg:px-8 topbar-glass transition-all duration-200",
          scrolled ? "border-border shadow-[0_16px_40px_rgba(15,23,42,0.08)]" : "border-transparent"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/90 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:text-foreground hover:shadow-card sm:h-11 sm:w-11 sm:rounded-2xl"
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">St. Joseph&apos;s Preparatory School</p>
            <h1 className="truncate pr-1 text-[16px] font-semibold tracking-[-0.04em] text-foreground sm:mt-1 sm:text-[20px]" style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden 2xl:block mr-2 opacity-90">
            <BrandLogo compact className="scale-[0.92]" />
          </div>
          <div className="hidden xl:flex items-center gap-2 h-11 px-4 bg-card/90 border border-border/70 rounded-2xl focus-within:bg-background focus-within:border-border focus-within:shadow-glow-crimson transition-all duration-200 w-80 shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-card">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <input
              placeholder="Search HawkLife…"
              className="flex-1 min-w-0 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/90 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:text-foreground hover:shadow-card sm:h-11 sm:w-11 sm:rounded-2xl"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/90 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:text-foreground hover:shadow-card sm:h-11 sm:w-11 sm:rounded-2xl"
              aria-label="Open notifications"
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 ? (
                <span className="absolute right-1 top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-crimson px-1.5 py-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-card">
                  {Math.min(unreadNotifications, 9)}
                </span>
              ) : null}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(20rem,calc(100vw-1.5rem))] origin-top-right animate-fade-up overflow-hidden rounded-3xl border border-border bg-card shadow-modal">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-[13px] font-bold text-foreground">Notifications</p>
                  <span className="text-[11px] text-muted-foreground">{unreadNotifications} unread</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(139,26,26,.08)] text-[rgb(139,26,26)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-[13px] font-semibold text-foreground">Everything is quiet</p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">New updates and alerts will appear here.</p>
                  </div>
                ) : (
                  <div className="max-h-[24rem] overflow-y-auto">
                    {notifications.map((notification, index) => (
                      <div key={notification.id} className={cn("px-4 py-3", index < notifications.length - 1 && "border-b border-border/70")}>
                        <p className="text-[12.5px] font-semibold text-foreground">{notification.title}</p>
                        <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">{notification.body}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-border px-4 py-3 text-center">
                  <Link href="/announcements" onClick={() => setNotifOpen(false)} className="text-[12.5px] font-medium" style={{ color: "#8B1A1A" }}>
                    Open announcements →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link href="/profile" aria-label="Open profile">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:ring-crimson/30 sm:h-10 sm:w-10">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-white text-[11px] font-bold" style={{ background: "linear-gradient(135deg, #B8952E, #A31212)" }}>
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>
    </>
  );
}
