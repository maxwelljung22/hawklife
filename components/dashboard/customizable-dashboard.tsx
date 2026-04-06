"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { format, isToday } from "date-fns";
import {
  Bell,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Grip,
  LayoutGrid,
  Megaphone,
  Minus,
  Pin,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  DASHBOARD_WIDGET_SIZES,
  clampWidgetSize,
  getDashboardLayoutStorageKey,
  type DashboardLayoutWidget,
  type DashboardWidgetSize,
  type DashboardWidgetType,
} from "@/lib/dashboard-preferences";
import { cn, formatRelativeTime } from "@/lib/utils";

type DashboardData = {
  userId: string;
  membershipCount: number;
  unreadNotifs: number;
  upcomingEvents: any[];
  recentPosts: any[];
  myMemberships: any[];
  workspaceTasks: any[];
  notifications: any[];
  assignmentDeadlines: any[];
  applicationDeadlines: any[];
  pinnedPosts: any[];
  importantResources: any[];
};

const WIDGET_LIBRARY: Array<{
  type: DashboardWidgetType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultSize: DashboardWidgetSize;
}> = [
  { type: "today-overview", title: "Today Overview", description: "A quick pulse on today’s activity, tasks, and unread items.", icon: Sparkles, defaultSize: 6 },
  { type: "upcoming-deadlines", title: "Upcoming Deadlines", description: "Assignments, tasks, and application cutoffs in one list.", icon: Bell, defaultSize: 6 },
  { type: "my-tasks", title: "My Tasks", description: "Tasks from club workspaces assigned to you or relevant to your clubs.", icon: CheckSquare, defaultSize: 12 },
  { type: "announcements", title: "Announcements", description: "Recent updates from your clubs and the broader school stream.", icon: Megaphone, defaultSize: 6 },
  { type: "my-clubs", title: "My Clubs", description: "Your active memberships, roles, and meeting snapshots.", icon: Users, defaultSize: 3 },
  { type: "calendar", title: "Calendar", description: "Upcoming meetings and events pulled from HawkLife.", icon: CalendarDays, defaultSize: 6 },
  { type: "activity-feed", title: "Activity Feed", description: "A mixed feed of notifications and recent announcement activity.", icon: LayoutGrid, defaultSize: 6 },
  { type: "pinned-items", title: "Pinned Items", description: "Pinned announcements and important resources worth keeping close.", icon: Pin, defaultSize: 3 },
] as const;

const WIDGET_BY_TYPE = Object.fromEntries(WIDGET_LIBRARY.map((widget) => [widget.type, widget]));
const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

function createWidget(type: DashboardWidgetType): DashboardLayoutWidget {
  return {
    id: `widget-${type}-${Date.now()}`,
    type,
    size: WIDGET_BY_TYPE[type].defaultSize,
  };
}

function sanitizeLayout(layout: DashboardLayoutWidget[]) {
  const seen = new Set<DashboardWidgetType>();

  return layout.filter((widget) => {
    if (!(widget.type in WIDGET_BY_TYPE)) return false;
    if (seen.has(widget.type)) return false;
    seen.add(widget.type);
    return true;
  }).map((widget) => ({ ...widget, size: clampWidgetSize(widget.size) }));
}

function resizeFromDelta(initialSize: DashboardWidgetSize, deltaX: number): DashboardWidgetSize {
  const currentIndex = DASHBOARD_WIDGET_SIZES.indexOf(initialSize);
  const step = Math.round(deltaX / 180);
  const nextIndex = Math.max(0, Math.min(DASHBOARD_WIDGET_SIZES.length - 1, currentIndex + step));
  return DASHBOARD_WIDGET_SIZES[nextIndex];
}

function widgetSpanClass(size: DashboardWidgetSize) {
  if (size === 3) return "col-span-1 sm:col-span-3 xl:col-span-3";
  if (size === 6) return "col-span-1 sm:col-span-6 xl:col-span-6";
  return "col-span-1 sm:col-span-6 xl:col-span-12";
}

function itemCountBySize(size: DashboardWidgetSize) {
  if (size === 3) return 3;
  if (size === 6) return 4;
  return 6;
}

function WidgetFrame({
  widget,
  title,
  icon: Icon,
  isEditing,
  isDragging,
  onRemove,
  onMoveUp,
  onMoveDown,
  onResizeStart,
  onSetSize,
  children,
}: {
  widget: DashboardLayoutWidget;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isEditing: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onResizeStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onSetSize: (size: DashboardWidgetSize) => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: isDragging ? 1.015 : 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: MOTION_EASE }}
      className={cn(
        "surface-panel relative overflow-hidden rounded-[2rem] p-4 sm:p-5",
        widgetSpanClass(widget.size),
        isDragging && "z-10 shadow-[0_28px_70px_rgba(15,23,42,0.18)]"
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.13),transparent_72%)]" />
      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-[1.12rem] font-semibold tracking-[-0.04em] text-foreground">{title}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Widget</p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={onMoveUp}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Move widget earlier"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Move widget later"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                aria-label="Remove widget"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        {children}

        {isEditing ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <div className="flex items-center gap-2">
              {DASHBOARD_WIDGET_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => onSetSize(size)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                    widget.size === size
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {size === 3 ? "Small" : size === 6 ? "Medium" : "Large"}
                </button>
              ))}
            </div>

            <button
              onPointerDown={onResizeStart}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Grip className="h-3.5 w-3.5" />
              Resize
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export function CustomizableDashboard(data: DashboardData) {
  const storageKey = getDashboardLayoutStorageKey(data.userId);
  const resizeStateRef = useRef<{ id: string; startX: number; startSize: DashboardWidgetSize } | null>(null);
  const [layout, setLayout] = useState<DashboardLayoutWidget[]>(DEFAULT_DASHBOARD_LAYOUT);
  const [hydrated, setHydrated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DashboardLayoutWidget[];
        const nextLayout = sanitizeLayout(parsed);
        setLayout(nextLayout.length > 0 ? nextLayout : DEFAULT_DASHBOARD_LAYOUT);
      } catch {
        setLayout(DEFAULT_DASHBOARD_LAYOUT);
      }
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(layout));
  }, [hydrated, layout, storageKey]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      const nextSize = resizeFromDelta(resizeState.startSize, event.clientX - resizeState.startX);
      setLayout((current) => current.map((widget) => (widget.id === resizeState.id ? { ...widget, size: nextSize } : widget)));
    };

    const handlePointerUp = () => {
      resizeStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const activeTypes = useMemo(() => new Set(layout.map((widget) => widget.type)), [layout]);
  const availableWidgets = useMemo(() => WIDGET_LIBRARY.filter((widget) => !activeTypes.has(widget.type)), [activeTypes]);

  const deadlines = useMemo(() => {
    const taskDeadlines = data.workspaceTasks
      .filter((task) => task.dueAt)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        subtitle: `${task.club?.name ?? "Club task"} · ${task.status.replaceAll("_", " ")}`,
        dueAt: new Date(task.dueAt),
        href: task.club?.slug ? `/clubs/${task.club.slug}/workspace` : "/dashboard",
      }));

    const assignmentDeadlines = data.assignmentDeadlines.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      subtitle: `${assignment.club?.name ?? "Club"} assignment`,
      dueAt: new Date(assignment.dueAt),
      href: assignment.club?.slug ? `/clubs/${assignment.club.slug}/workspace` : "/dashboard",
    }));

    const applicationDeadlines = data.applicationDeadlines.map((form) => ({
      id: `application-${form.id}`,
      title: `${form.club?.name ?? "Club"} applications`,
      subtitle: "Application window closes soon",
      dueAt: new Date(form.deadline),
      href: "/applications",
    }));

    return [...taskDeadlines, ...assignmentDeadlines, ...applicationDeadlines]
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, 8);
  }, [data.applicationDeadlines, data.assignmentDeadlines, data.workspaceTasks]);

  const todayOverview = useMemo(() => {
    const eventsToday = data.upcomingEvents.filter((event) => isToday(new Date(event.startTime)));
    const tasksDueToday = data.workspaceTasks.filter((task) => task.dueAt && isToday(new Date(task.dueAt)));
    const nextEvent = data.upcomingEvents[0] ?? null;

    return {
      stats: [
        { label: "Today’s events", value: eventsToday.length },
        { label: "Tasks due", value: tasksDueToday.length },
        { label: "Unread", value: data.unreadNotifs },
        { label: "Active clubs", value: data.membershipCount },
      ],
      nextEvent,
    };
  }, [data.membershipCount, data.unreadNotifs, data.upcomingEvents, data.workspaceTasks]);

  const activityFeed = useMemo(() => {
    const notificationItems = data.notifications.map((notification) => ({
      id: `notification-${notification.id}`,
      title: notification.title,
      body: notification.body,
      timestamp: new Date(notification.createdAt),
      href: notification.refType === "announcement" ? "/announcements" : "/dashboard",
      source: "Notification",
    }));

    const postItems = data.recentPosts.map((post) => ({
      id: `post-${post.id}`,
      title: post.title,
      body: post.content,
      timestamp: new Date(post.createdAt),
      href: "/announcements",
      source: post.club?.name ?? "Announcement",
    }));

    return [...notificationItems, ...postItems]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  }, [data.notifications, data.recentPosts]);

  const pinnedItems = useMemo(() => {
    const posts = data.pinnedPosts.map((post) => ({
      id: `pinned-post-${post.id}`,
      title: post.title,
      subtitle: post.club?.name ?? "Pinned announcement",
      href: "/announcements",
      kind: "Pinned post",
    }));

    const resources = data.importantResources.map((resource) => ({
      id: `resource-${resource.id}`,
      title: resource.name,
      subtitle: resource.club?.name ?? "Resource",
      href: resource.club?.slug ? `/clubs/${resource.club.slug}/workspace` : "/clubs",
      kind: resource.category === "FORM" ? "Form" : "Resource",
    }));

    return [...posts, ...resources].slice(0, 8);
  }, [data.importantResources, data.pinnedPosts]);

  const moveWidget = (widgetId: string, direction: -1 | 1) => {
    setLayout((current) => {
      const index = current.findIndex((widget) => widget.id === widgetId);
      if (index === -1) return current;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const reorderWidgets = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setLayout((current) => {
      const next = [...current];
      const fromIndex = next.findIndex((widget) => widget.id === fromId);
      const toIndex = next.findIndex((widget) => widget.id === toId);
      if (fromIndex === -1 || toIndex === -1) return current;
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const renderWidgetContent = (widget: DashboardLayoutWidget) => {
    const maxItems = itemCountBySize(widget.size);

    switch (widget.type) {
      case "today-overview":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {todayOverview.stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.4rem] border border-border bg-card/70 px-4 py-4">
                  <p className="font-display text-[1.6rem] font-semibold tracking-[-0.05em] text-foreground">{stat.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[1.4rem] border border-border bg-card/70 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Next up</p>
              {todayOverview.nextEvent ? (
                <>
                  <p className="mt-2 text-[15px] font-semibold text-foreground">{todayOverview.nextEvent.title}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {format(new Date(todayOverview.nextEvent.startTime), "EEE, MMM d · h:mm a")}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[13px] text-muted-foreground">Nothing is scheduled next yet.</p>
              )}
            </div>
          </div>
        );
      case "upcoming-deadlines":
        return deadlines.length ? (
          <div className="space-y-3">
            {deadlines.slice(0, maxItems).map((deadline) => (
              <Link key={deadline.id} href={deadline.href} className="block rounded-[1.3rem] border border-border bg-card/70 px-4 py-3.5 transition-colors hover:bg-muted/60">
                <p className="text-[14px] font-semibold text-foreground">{deadline.title}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{deadline.subtitle}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--primary))]">
                  Due {format(deadline.dueAt, "EEE, MMM d · h:mm a")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyWidgetBody title="No deadlines on deck" description="Assignments, tasks, and application cutoffs will appear here." />
        );
      case "my-tasks":
        return data.workspaceTasks.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.workspaceTasks.slice(0, maxItems).map((task) => (
              <Link key={task.id} href={task.club?.slug ? `/clubs/${task.club.slug}/workspace` : "/dashboard"} className="block rounded-[1.35rem] border border-border bg-card/70 px-4 py-4 transition-colors hover:bg-muted/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">{task.title}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{task.club?.name ?? "Club task"}</p>
                  </div>
                  <span className="rounded-full bg-[hsl(var(--primary)/0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--primary))]">
                    {task.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-[12px] text-muted-foreground">
                  {task.dueAt ? `Due ${format(new Date(task.dueAt), "MMM d · h:mm a")}` : "No due date set"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyWidgetBody title="No active tasks" description="Workspace tasks from your clubs will appear here." />
        );
      case "announcements":
        return data.recentPosts.length ? (
          <div className="space-y-3">
            {data.recentPosts.slice(0, maxItems).map((post) => (
              <Link key={post.id} href="/announcements" className="block rounded-[1.3rem] border border-border bg-card/70 px-4 py-3.5 transition-colors hover:bg-muted/60">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-foreground/80">{post.club?.name ?? "Announcement"}</span>
                  <span className="text-[11px] text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
                </div>
                <p className="mt-2 text-[14px] font-semibold text-foreground">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{post.content}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyWidgetBody title="No announcements yet" description="Recent posts from your clubs will show up here." />
        );
      case "my-clubs":
        return data.myMemberships.length ? (
          <div className="space-y-3">
            {data.myMemberships.slice(0, maxItems).map((membership) => (
              <Link key={membership.id} href={`/clubs/${membership.club.slug}`} className="flex items-center gap-3 rounded-[1.3rem] border border-border bg-card/70 px-4 py-3.5 transition-colors hover:bg-muted/60">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: `linear-gradient(135deg, ${membership.club.gradientFrom}, ${membership.club.gradientTo})` }}
                >
                  {membership.club.emoji}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-foreground">{membership.club.name}</p>
                  <p className="text-[12px] text-muted-foreground">{membership.role.toLowerCase().replaceAll("_", " ")}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyWidgetBody title="No clubs yet" description="Join a club to start building your dashboard around it." />
        );
      case "calendar":
        return data.upcomingEvents.length ? (
          <div className="space-y-3">
            {data.upcomingEvents.slice(0, maxItems).map((event) => (
              <Link key={event.id} href="/calendar" className="flex items-center gap-3 rounded-[1.3rem] border border-border bg-card/70 px-4 py-3.5 transition-colors hover:bg-muted/60">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                  <span className="font-display text-[1rem] font-semibold leading-none">{format(new Date(event.startTime), "d")}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">{format(new Date(event.startTime), "MMM")}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-foreground">{event.title}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {format(new Date(event.startTime), "EEE · h:mm a")} {event.club?.name ? `· ${event.club.name}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyWidgetBody title="Nothing on the calendar" description="Upcoming meetings and events will appear here." />
        );
      case "activity-feed":
        return activityFeed.length ? (
          <div className="space-y-3">
            {activityFeed.slice(0, maxItems).map((item) => (
              <Link key={item.id} href={item.href} className="block rounded-[1.3rem] border border-border bg-card/70 px-4 py-3.5 transition-colors hover:bg-muted/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold text-[hsl(var(--primary))]">{item.source}</p>
                  <p className="text-[11px] text-muted-foreground">{formatRelativeTime(item.timestamp)}</p>
                </div>
                <p className="mt-2 text-[14px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{item.body}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyWidgetBody title="No recent activity" description="Notifications and post activity will show up here." />
        );
      case "pinned-items":
        return pinnedItems.length ? (
          <div className="space-y-3">
            {pinnedItems.slice(0, maxItems).map((item) => (
              <Link key={item.id} href={item.href} className="block rounded-[1.3rem] border border-border bg-card/70 px-4 py-3.5 transition-colors hover:bg-muted/60">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--primary))]">{item.kind}</p>
                <p className="mt-2 text-[14px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyWidgetBody title="Nothing pinned right now" description="Pinned announcements and important resources will appear here." />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[2rem] border border-border bg-card/70 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Editable dashboard</p>
          <h2 className="mt-1 font-display text-[1.4rem] font-semibold tracking-[-0.04em] text-foreground">
            Arrange your space the way you want it
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted-foreground">
            Add, remove, resize, and rearrange widgets. Layout changes save automatically on this device.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={isEditing ? "secondary" : "primary"} size="md" onClick={() => setIsEditing((current) => !current)}>
            {isEditing ? "Done Editing" : "Edit Dashboard"}
          </Button>
          <Button variant="secondary" size="md" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        </div>
      </div>

      {layout.length === 0 ? (
        <div className="surface-panel rounded-[2rem] px-6 py-12 text-center">
          <p className="font-display text-[1.6rem] font-semibold tracking-[-0.05em] text-foreground">Your dashboard is empty — add widgets to get started</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Build a layout that feels more like your own workspace than a fixed page.</p>
          <Button className="mt-5" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 xl:grid-cols-12">
          <AnimatePresence initial={false}>
            {layout.map((widget, index) => {
              const definition = WIDGET_BY_TYPE[widget.type];
              return (
                <div
                  key={widget.id}
                  draggable={isEditing}
                  onDragStart={(event) => {
                    if (!isEditing) return;
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", widget.id);
                    setDraggingId(widget.id);
                  }}
                  onDragOver={(event) => {
                    if (!isEditing || draggingId === widget.id) return;
                    event.preventDefault();
                    setDragOverId(widget.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const draggedId = event.dataTransfer.getData("text/plain") || draggingId;
                    if (draggedId) reorderWidgets(draggedId, widget.id);
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  className={cn(dragOverId === widget.id && "rounded-[2rem] ring-2 ring-[hsl(var(--primary)/0.35)] ring-offset-2 ring-offset-background")}
                >
                  <WidgetFrame
                    widget={widget}
                    title={definition.title}
                    icon={definition.icon}
                    isEditing={isEditing}
                    isDragging={draggingId === widget.id}
                    onRemove={() => setLayout((current) => current.filter((item) => item.id !== widget.id))}
                    onMoveUp={() => moveWidget(widget.id, -1)}
                    onMoveDown={() => moveWidget(widget.id, 1)}
                    onResizeStart={(event) => {
                      if (!isEditing) return;
                      event.preventDefault();
                      resizeStateRef.current = {
                        id: widget.id,
                        startX: event.clientX,
                        startSize: widget.size,
                      };
                    }}
                    onSetSize={(size) =>
                      setLayout((current) => current.map((item) => (item.id === widget.id ? { ...item, size } : item)))
                    }
                  >
                    {renderWidgetContent(widget)}
                    {isEditing ? (
                      <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Position {index + 1}
                      </div>
                    ) : null}
                  </WidgetFrame>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {pickerOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6"
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18, ease: MOTION_EASE }}
              className="surface-panel w-full max-w-4xl rounded-[2rem] p-5 sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Widget library</p>
                  <h3 className="mt-1 font-display text-[1.5rem] font-semibold tracking-[-0.04em] text-foreground">Add a widget</h3>
                  <p className="mt-2 text-[13px] text-muted-foreground">Pick from the available dashboard modules below. New widgets appear instantly.</p>
                </div>
                <button
                  onClick={() => setPickerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {availableWidgets.length ? (
                  availableWidgets.map((widget) => (
                    <button
                      key={widget.type}
                      onClick={() => {
                        setLayout((current) => [...current, createWidget(widget.type)]);
                        setPickerOpen(false);
                      }}
                      className="rounded-[1.5rem] border border-border bg-card/80 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(var(--primary)/0.4)] hover:shadow-card-hover"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                          <widget.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-foreground">{widget.title}</p>
                          <p className="mt-1 text-[12.5px] leading-6 text-muted-foreground">{widget.description}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-border bg-card/80 p-6 text-center md:col-span-2">
                    <p className="font-display text-[1.2rem] font-semibold text-foreground">All widgets already added</p>
                    <p className="mt-2 text-[13px] text-muted-foreground">Remove one from edit mode if you want to swap the layout around.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function EmptyWidgetBody({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-border bg-card/60 px-4 py-8 text-center">
      <p className="font-display text-[1.1rem] font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-[12.5px] text-muted-foreground">{description}</p>
    </div>
  );
}

