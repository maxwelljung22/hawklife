"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, Compass, CalendarDays, Megaphone,
  Vote, FileStack, Sparkles, ShieldCheck, GraduationCap, LogOut, Rocket, X, ScanLine, PlusSquare, Info,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { canAccessAdmin, canAccessOversight, getRoleBadgeClass, getRoleLabel } from "@/lib/roles";
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

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <House className="h-4 w-4" /> },
      { label: "Clubs", href: "/clubs", icon: <Compass className="h-4 w-4" /> },
      { label: "Calendar", href: "/calendar", icon: <CalendarDays className="h-4 w-4" /> },
      { label: "Flex Block", href: "/flex", icon: <ScanLine className="h-4 w-4" /> },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Announcements", href: "/announcements", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Voting", href: "/voting", icon: <Vote className="h-4 w-4" /> },
      { label: "Applications", href: "/applications", icon: <FileStack className="h-4 w-4" /> },
      { label: "What's New", href: "/changelog", icon: <Sparkles className="h-4 w-4" /> },
    ],
  },
  {
    label: "School",
    items: [
      { label: "New Charter", href: "/charter/apply", icon: <Rocket className="h-4 w-4" /> },
      { label: "NHS Hours", href: "/nhs", icon: <GraduationCap className="h-4 w-4" /> },
      { label: "About HawkLife", href: "/about", icon: <Info className="h-4 w-4" /> },
    ],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Admin Panel", href: "/admin", icon: <ShieldCheck className="h-4 w-4" />, exact: true },
  { label: "Charters", href: "/admin/charters", icon: <Rocket className="h-4 w-4" /> },
  { label: "Create Session", href: "/faculty/create-session", icon: <PlusSquare className="h-4 w-4" /> },
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

  const renderNavItem = (item: NavItem, emphasis: "default" | "oversight" = "default") => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-[13.5px] font-medium transition-all duration-150 surface-hover",
        isActive(item) ? "shadow-sm" : "hover:-translate-y-[2px]"
      )}
      style={
        isActive(item)
          ? {
              background: "linear-gradient(180deg, hsl(var(--shell-sidebar-active)), hsl(var(--shell-sidebar-active) / 0.92))",
              color: "hsl(var(--shell-sidebar-foreground))",
              borderColor: "hsl(var(--shell-sidebar-border))",
              boxShadow: "0 18px 36px rgba(15,23,42,0.12)",
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
          background: isActive(item)
            ? "linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.18))"
            : emphasis === "oversight"
              ? "hsl(var(--primary) / 0.10)"
              : "hsl(var(--muted) / 0.9)",
          color: isActive(item) || emphasis === "oversight" ? "hsl(var(--primary))" : "currentColor",
        }}
      >
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.isNew ? (
        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white" style={{ background: "linear-gradient(135deg, #8B1A1A, #B7902B)" }}>
          Fresh
        </span>
      ) : null}
    </Link>
  );

  return (
    <>
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 140% 50% at 68% -10%, rgba(139,26,26,.18) 0%, transparent 60%)," +
            "radial-gradient(ellipse 70% 30% at 15% 100%, rgba(154,124,46,.08) 0%, transparent 55%)",
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
      <nav className="relative z-10 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.label} className="space-y-1.5">
            <p
              className={cn("px-3 text-[9.5px] font-bold uppercase tracking-[0.14em]", index === 0 ? "mt-2" : "mt-0")}
              style={{ color: "hsl(var(--shell-sidebar-muted))" }}
            >
              {section.label}
            </p>
            {section.items.map((item) => renderNavItem(item))}
          </div>
        ))}

        {canAccessOversight(user.role) && (
          <div className="space-y-1.5">
            <p className="px-3 text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "hsl(var(--shell-sidebar-muted))" }}>
              Oversight
            </p>
            {ADMIN_ITEMS.filter((item) => item.href !== "/admin/charters" || canAccessAdmin(user.role)).map((item) =>
              renderNavItem(item, "oversight")
            )}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="relative z-10 px-4 py-4 border-t" style={{ borderColor: "hsl(var(--shell-sidebar-border))" }}>
        <div className="group flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition-colors" style={{ background: "hsl(var(--muted) / 0.6)", borderColor: "hsl(var(--shell-sidebar-border))" }}>
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
