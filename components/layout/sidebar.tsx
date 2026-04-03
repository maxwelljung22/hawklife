"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, Compass, CalendarDays, Megaphone,
  Vote, FileStack, Sparkles, ShieldCheck, GraduationCap, LogOut, Rocket, X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { canAccessAdmin, getRoleBadgeClass, getRoleLabel } from "@/lib/roles";
import type { UserRole } from "@prisma/client";
import { BrandLogo } from "./brand-logo";

interface NavItem {
  label:  string;
  href:   string;
  icon:   React.ReactNode;
  badge?: number;
  isNew?: boolean;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",     icon: <House           className="h-4 w-4" /> },
  { label: "Clubs",         href: "/clubs",         icon: <Compass         className="h-4 w-4" /> },
  { label: "Calendar",      href: "/calendar",      icon: <CalendarDays    className="h-4 w-4" /> },
  { label: "Announcements", href: "/announcements", icon: <Megaphone       className="h-4 w-4" /> },
  { label: "Voting",        href: "/voting",         icon: <Vote            className="h-4 w-4" /> },
  { label: "Applications",  href: "/applications",  icon: <FileStack       className="h-4 w-4" /> },
  { label: "New Charter",   href: "/charter/apply", icon: <Rocket          className="h-4 w-4" /> },
  { label: "What's New",    href: "/changelog",     icon: <Sparkles        className="h-4 w-4" /> },
  { label: "NHS Hours",     href: "/nhs",           icon: <GraduationCap   className="h-4 w-4" /> },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Admin Panel", href: "/admin", icon: <ShieldCheck className="h-4 w-4" />, exact: true },
  { label: "Charters", href: "/admin/charters", icon: <Rocket className="h-4 w-4" /> },
];

export interface ShellUser {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null; role: UserRole };
}

function SidebarNavContent({
  user,
  onNavigate,
  mobile = false,
}: {
  user: ShellUser["user"];
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.exact || item.href === "/dashboard") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <>
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
      <div className="relative z-10 flex items-center justify-between border-b px-6 py-6" style={{ borderColor: "hsl(var(--shell-sidebar-border))" }}>
        <BrandLogo />
        {mobile ? (
          <button
            onClick={onNavigate}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card/90 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
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
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 px-3 py-3 rounded-2xl text-[13.5px] font-medium transition-all duration-150 border",
              isActive(item)
                ? "shadow-sm"
                : "hover:-translate-y-[1px]"
            )}
            style={
              isActive(item)
                ? {
                    background: "hsl(var(--shell-sidebar-active))",
                    color: "hsl(var(--shell-sidebar-foreground))",
                    borderColor: "hsl(var(--shell-sidebar-border))",
                    boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
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
                background: isActive(item) ? "linear-gradient(135deg, rgba(139,26,26,.14), rgba(183,144,43,.14))" : "rgba(127,127,127,.08)",
                color: isActive(item) ? "#8B1A1A" : "currentColor",
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
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-2xl text-[13.5px] font-medium transition-all duration-150 border",
                  isActive(item)
                    ? "shadow-sm"
                    : "hover:-translate-y-[1px]"
                )}
                style={
                  isActive(item)
                    ? {
                        background: "hsl(var(--shell-sidebar-active))",
                        color: "hsl(var(--shell-sidebar-foreground))",
                        borderColor: "hsl(var(--shell-sidebar-border))",
                        boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
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
                    background: isActive(item) ? "linear-gradient(135deg, rgba(139,26,26,.14), rgba(183,144,43,.14))" : "rgba(139,26,26,.10)",
                    color: "#8B1A1A",
                  }}
                >
                  {item.icon}
                </span>
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
            onClick={() => {
              onNavigate?.();
              signOut({ callbackUrl: "/auth/signin" });
            }}
            className={cn("transition-opacity", mobile ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 transition-colors" style={{ color: "hsl(var(--shell-sidebar-muted))" }} />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar({ user }: ShellUser) {
  return (
    <aside className="sidebar-bg fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r lg:flex" style={{ borderColor: "hsl(var(--shell-sidebar-border))" }}>
      <SidebarNavContent user={user} />
    </aside>
  );
}

export function MobileSidebarSheet({
  user,
  open,
  onClose,
}: {
  user: ShellUser["user"];
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div className={cn("fixed inset-0 z-[70] lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-black/45 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <aside
        className={cn(
          "sidebar-bg absolute inset-y-0 left-0 flex w-[min(86vw,22rem)] flex-col border-r transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ borderColor: "hsl(var(--shell-sidebar-border))" }}
      >
        <SidebarNavContent user={user} onNavigate={onClose} mobile />
      </aside>
    </div>
  );
}
