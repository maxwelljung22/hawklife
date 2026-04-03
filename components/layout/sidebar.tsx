"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, Compass, CalendarDays, Megaphone,
  Vote, FileStack, Sparkles, ShieldCheck, GraduationCap, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { canAccessAdmin, getRoleBadgeClass, getRoleLabel } from "@/lib/roles";
import type { UserRole } from "@prisma/client";

interface NavItem {
  label:  string;
  href:   string;
  icon:   React.ReactNode;
  badge?: number;
  isNew?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",     icon: <House           className="h-4 w-4" /> },
  { label: "Clubs",         href: "/clubs",         icon: <Compass         className="h-4 w-4" /> },
  { label: "Calendar",      href: "/calendar",      icon: <CalendarDays    className="h-4 w-4" /> },
  { label: "Announcements", href: "/announcements", icon: <Megaphone       className="h-4 w-4" /> },
  { label: "Voting",        href: "/voting",         icon: <Vote            className="h-4 w-4" /> },
  { label: "Applications",  href: "/applications",  icon: <FileStack       className="h-4 w-4" /> },
  { label: "What's New",    href: "/changelog",     icon: <Sparkles        className="h-4 w-4" /> },
  { label: "NHS Hours",     href: "/nhs",           icon: <GraduationCap   className="h-4 w-4" /> },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Admin Panel", href: "/admin", icon: <ShieldCheck className="h-4 w-4" /> },
];

interface SidebarProps {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null; role: UserRole };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-72 sidebar-bg flex flex-col border-r" style={{ borderColor: "hsl(var(--shell-sidebar-border))" }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 140% 50% at 70% -10%, rgba(139,26,26,.16) 0%, transparent 60%)," +
            "radial-gradient(ellipse 60% 30% at 10% 100%, rgba(154,124,46,.07) 0%, transparent 50%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 px-6 py-6 border-b" style={{ borderColor: "hsl(var(--shell-sidebar-border))" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="h-10 w-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8B1A1A, #B7902B)", boxShadow: "0 12px 32px rgba(139,26,26,.22)" }}
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M2 4h12M4 8h8M6 12h4" />
            </svg>
          </div>
          <div>
            <p className="text-[16px] font-bold tracking-tight leading-none" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--shell-sidebar-foreground))" }}>
              PrepLife
            </p>
            <p className="text-[10px] mt-0.5 tracking-[.16em] uppercase" style={{ color: "hsl(var(--shell-sidebar-muted))" }}>St. Joseph&apos;s Prep</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 px-4 py-4 overflow-y-auto space-y-1">
        <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase px-3 mb-2 mt-2" style={{ color: "hsl(var(--shell-sidebar-muted))" }}>
          Student Hub
        </p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 px-3 py-3 rounded-2xl text-[13.5px] font-medium transition-all duration-150 border",
              isActive(item.href)
                ? "shadow-sm"
                : "hover:-translate-y-[1px]"
            )}
            style={
              isActive(item.href)
                ? {
                    background: "hsl(var(--shell-sidebar-active))",
                    color: "hsl(var(--shell-sidebar-foreground))",
                    borderColor: "hsl(var(--shell-sidebar-border))",
                  }
                : {
                    color: "hsl(var(--shell-sidebar-muted))",
                    borderColor: "transparent",
                  }
            }
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: isActive(item.href) ? "linear-gradient(135deg, rgba(139,26,26,.14), rgba(183,144,43,.14))" : "rgba(127,127,127,.08)",
                color: isActive(item.href) ? "#8B1A1A" : "currentColor",
              }}
            >
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.isNew && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-white px-1.5 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg, #8B1A1A, #B7902B)" }}>
                Fresh
              </span>
            )}
          </Link>
        ))}

        {canAccessAdmin(user.role) && (
          <>
            <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase px-3 mb-2 mt-5" style={{ color: "hsl(var(--shell-sidebar-muted))" }}>
              Administration
            </p>
            {ADMIN_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-2xl text-[13.5px] font-medium transition-all duration-150 border",
                  isActive(item.href)
                    ? "shadow-sm"
                    : "hover:-translate-y-[1px]"
                )}
                style={
                  isActive(item.href)
                    ? {
                        background: "hsl(var(--shell-sidebar-active))",
                        color: "hsl(var(--shell-sidebar-foreground))",
                        borderColor: "hsl(var(--shell-sidebar-border))",
                      }
                    : {
                        color: "hsl(var(--shell-sidebar-muted))",
                        borderColor: "transparent",
                      }
                }
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(139,26,26,.10)", color: "#8B1A1A" }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="relative z-10 px-4 py-4 border-t" style={{ borderColor: "hsl(var(--shell-sidebar-border))" }}>
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors cursor-pointer group" style={{ background: "rgba(127,127,127,.06)" }}>
          <Avatar className="h-[30px] w-[30px] flex-shrink-0">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #B8952E, #A31212)" }}>
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate leading-none" style={{ color: "hsl(var(--shell-sidebar-foreground))" }}>{user.name}</p>
            <div className="mt-1">
              <span className={cn("inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium", getRoleBadgeClass(user.role))}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 transition-colors" style={{ color: "hsl(var(--shell-sidebar-muted))" }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
