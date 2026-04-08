"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MobileSidebarSheet, Sidebar, type ShellUser } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

type ShellNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string | Date;
  type: string;
  refId?: string | null;
  refType?: string | null;
  isRead: boolean;
};

export function AppShell({
  user,
  notifications,
  unreadNotifications,
  children,
}: {
  user: ShellUser["user"];
  notifications: ShellNotification[];
  unreadNotifications: number;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncSidebarState = (matchesDesktop: boolean) => {
      setIsDesktop(matchesDesktop);

      if (!matchesDesktop) {
        setSidebarOpen(false);
        return;
      }

      const stored = window.localStorage.getItem("hawklife:sidebar-open");
      setSidebarOpen(stored !== null ? stored === "true" : true);
    };

    syncSidebarState(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => syncSidebarState(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    setHydrated(true);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!hydrated || !isDesktop) return;
    window.localStorage.setItem("hawklife:sidebar-open", String(sidebarOpen));
  }, [hydrated, isDesktop, sidebarOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const shouldLockScroll = hydrated && !isDesktop && sidebarOpen;
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [hydrated, isDesktop, sidebarOpen]);

  return (
    <div className="app-shell-bg flex min-h-screen bg-background">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MobileSidebarSheet user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={cn("flex min-w-0 flex-1 flex-col transition-[margin] duration-300", sidebarOpen ? "lg:ml-[288px]" : "lg:ml-0")}>
        <Topbar
          user={user}
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
          notifications={notifications}
          unreadNotifications={unreadNotifications}
        />
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
