// app/(app)/clubs/[slug]/club-detail-client.tsx
"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft, MapPin, Clock,
  ExternalLink,
  CheckCircle, XCircle, AlertCircle, Pencil, Trash2, Mail, Shield, GraduationCap, UserRound, LayoutGrid,
} from "lucide-react";
import { joinClub, leaveClub } from "../actions";
import {
  submitApplication,
  createPost,
  createClubEvent,
  createClubResource,
  updatePost,
  deletePost,
  updateClubEvent,
  deleteClubEvent,
  updateClubResource,
  deleteClubResource,
  updateClubWorkspace,
  updateClubMemberRole,
  removeClubMember,
} from "./actions";
import { cn, formatRelativeTime, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { MembershipRole, UserRole } from "@prisma/client";
import { CLUB_WEEKDAY_OPTIONS, parseMeetingDays } from "@/lib/club-schedule";
import { getClubLeadershipRoleLabel } from "@/lib/roles";

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "announcements", label: "Announcements" },
  { id: "events",        label: "Events" },
  { id: "members",       label: "Members" },
  { id: "workspace",     label: "Workspace" },
  { id: "applications",  label: "Apply", requiresApp: true },
];

interface Props {
  club: any;
  membership: any;
  isLeader: boolean;
  userId: string;
  userRole: UserRole;
  defaultTab: string;
  attendanceByUser: Record<string, any>;
}

export function ClubDetailClient({ club, membership, isLeader, userId, userRole, defaultTab, attendanceByUser }: Props) {
  const [tab, setTab] = useState(defaultTab);
  const [joined, setJoined] = useState(membership?.status === "ACTIVE");
  const [memberCount, setMemberCount] = useState(club._count.memberships);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isAdmin = userRole === "ADMIN";
  const canManage = isAdmin || isLeader;
  const canAccessWorkspace = joined || canManage;
  const meetingSchedule = parseMeetingDays(club.meetingDay);

  const handleToggle = () => {
    const next = !joined;
    setJoined(next);
    setMemberCount((c: number) => c + (next ? 1 : -1));

    startTransition(async () => {
      const result = next ? await joinClub(club.id) : await leaveClub(club.id);
      if (result?.error) {
        setJoined(!next);
        setMemberCount((c: number) => c + (next ? -1 : 1));
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: next ? `Joined ${club.name}! 🎉` : `Left ${club.name}` });
      }
    });
  };

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "workspace" && !canAccessWorkspace) return false;
    return !t.requiresApp || club.requiresApp;
  });

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/clubs" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        className="relative overflow-hidden rounded-3xl h-[210px]"
      >
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${club.gradientFrom}, ${club.gradientTo})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/30 to-transparent" />
        <div className="absolute inset-0 p-8 flex items-center gap-6">
          <span className="text-[60px] drop-shadow-xl leading-none flex-shrink-0">{club.emoji}</span>
          <div className="flex-1 text-white">
            <h1 className="font-display text-[30px] font-semibold leading-tight">{club.name}</h1>
            {club.tagline && <p className="text-[13.5px] text-white/62 mt-1.5 max-w-lg">{club.tagline}</p>}
            <div className="flex gap-2 mt-3.5 flex-wrap">
              {[
                club.category.charAt(0) + club.category.slice(1).toLowerCase(),
                `⚡ ${club.commitment.charAt(0) + club.commitment.slice(1).toLowerCase()}`,
                `👥 ${memberCount}`,
                ...(club.requiresApp ? ["📋 Apply"] : []),
              ].map((tag) => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-[.05em] px-2.5 py-1 rounded-full bg-white/13 border border-white/18 text-white/84 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleToggle}
              disabled={isPending}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all",
                joined
                  ? "bg-white/15 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm"
                  : "bg-crimson text-white shadow-xl shadow-crimson/40 hover:bg-crimson/90"
              )}
            >
              {joined ? "✓ Leave Club" : "+ Join Club"}
            </motion.button>
            <button className="px-5 py-2 rounded-xl text-[12.5px] font-medium bg-white/12 text-white/84 border border-white/18 hover:bg-white/22 transition-all backdrop-blur-sm">
              📅 Add to Calendar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-px border-b border-border">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-[500] border-b-[2.5px] -mb-px transition-all duration-150",
              tab === t.id
                ? "border-crimson text-crimson"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
        >
          {tab === "overview"      && <OverviewTab club={club} memberCount={memberCount} />}
          {tab === "announcements" && <AnnouncementsTab club={club} canManage={canManage} userId={userId} />}
          {tab === "events"        && <EventsTab club={club} canManage={canManage} />}
          {tab === "members"       && <MembersTab clubId={club.id} slug={club.slug} members={club.memberships} canManage={canManage} currentUserId={userId} attendanceByUser={attendanceByUser} />}
          {tab === "workspace"     && <WorkspaceTab club={club} resources={club.resources} canManage={canManage} canAccessWorkspace={canAccessWorkspace} />}
          {tab === "applications"  && <ApplicationsTab club={club} userId={userId} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ club, memberCount }: { club: any; memberCount: number }) {
  const leaders = club.memberships.filter((m: any) =>
    ["PRESIDENT", "OFFICER", "FACULTY_ADVISOR"].includes(m.role)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-7">
        <Section label="About">
          <p className="text-[14px] text-foreground/80 leading-relaxed">{club.description}</p>
        </Section>

        <Section label="Leadership">
          <div className="space-y-2">
            {leaders.length === 0 ? (
              <p className="text-[13.5px] text-muted-foreground">No leaders listed yet.</p>
            ) : (
              leaders.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.user.image} />
                    <AvatarFallback className="bg-gradient-to-br from-gold to-crimson text-white text-xs font-bold font-display">
                      {initials(m.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13.5px] font-semibold text-foreground">{m.user.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{getClubLeadershipRoleLabel(m.role)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section label="Meeting Schedule">
          {club.meetingDay || club.meetingTime || club.meetingRoom ? (
            <div className="space-y-2">
              {club.meetingDay && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <span className="w-14 text-[11px] font-bold uppercase tracking-[.07em] text-crimson">Day</span>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {CLUB_WEEKDAY_OPTIONS.map((day) => (
                        <span
                          key={day}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[12px] font-medium",
                            meetingSchedule.selectedDays.includes(day)
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-border bg-muted text-muted-foreground"
                          )}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                    {meetingSchedule.isCustom ? (
                      <span className="text-[13.5px] text-foreground">{club.meetingDay}</span>
                    ) : null}
                  </div>
                </div>
              )}
              {club.meetingTime && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[.07em] text-crimson w-14">Time</span>
                  <span className="text-[13.5px] text-foreground">{club.meetingTime}</span>
                </div>
              )}
              {club.meetingRoom && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[.07em] text-crimson w-14">Room</span>
                  <span className="text-[13.5px] text-foreground">{club.meetingRoom}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13.5px] text-muted-foreground">No schedule posted.</p>
          )}
        </Section>

        {club.tags.length > 0 && (
          <Section label="Tags">
            <div className="flex gap-2 flex-wrap">
              {club.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-muted rounded-full text-[12px] text-foreground/70">{tag}</span>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <p className="text-[13px] font-bold text-foreground mb-4">Membership</p>
          <div className="text-center py-3">
            <p className="font-display text-[44px] font-semibold text-foreground leading-none">{memberCount}</p>
            <p className="text-[11px] font-bold uppercase tracking-[.07em] text-muted-foreground mt-1.5">Active Members</p>
          </div>
          {/* Member avatars */}
          <div className="flex justify-center -space-x-1.5 my-3">
            {club.memberships.slice(0, 6).map((m: any, i: number) => (
              <Avatar key={m.id} className="h-7 w-7 ring-2 ring-card" style={{ zIndex: 6 - i }}>
                <AvatarImage src={m.user.image} />
                <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-navy to-crimson text-white">
                  {initials(m.user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {memberCount > 6 && (
              <div className="h-7 w-7 rounded-full ring-2 ring-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                +{memberCount - 6}
              </div>
            )}
          </div>
        </div>

        {club.events.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <p className="text-[13px] font-bold text-foreground mb-3">Next Event</p>
            <div className="bg-crimson/7 rounded-xl p-3.5">
              <p className="text-[12px] font-bold uppercase tracking-[.06em] text-crimson">{format(new Date(club.events[0].startTime), "EEEE")}</p>
              <p className="text-[15px] font-semibold text-foreground mt-0.5">{format(new Date(club.events[0].startTime), "h:mm a")}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{club.events[0].title}</p>
              {club.events[0].location && <p className="text-[11.5px] text-muted-foreground/60 mt-0.5">📍 {club.events[0].location}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────
function AnnouncementsTab({ club, canManage, userId }: { club: any; canManage: boolean; userId: string }) {
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [posts, setPosts] = useState(club.posts);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState({ title: "", content: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const { toast } = useToast();

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setSubmitting(true);
    const result = await createPost(club.id, newPost.title, newPost.content);
    setSubmitting(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result?.post) {
      setPosts([result.post, ...posts]);
      setNewPost({ title: "", content: "" });
      toast({ title: "Posted! ✓" });
    }
  };

  const handleStartEdit = (post: any) => {
    setEditingPostId(post.id);
    setEditPost({ title: post.title, content: post.content });
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editPost.title.trim() || !editPost.content.trim()) return;
    setSavingEdit(true);
    const result = await updatePost(postId, editPost.title, editPost.content);
    setSavingEdit(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    if (result?.post) {
      setPosts((current: any[]) => current.map((post) => (post.id === postId ? result.post : post)));
      setEditingPostId(null);
      toast({ title: "Announcement updated ✓" });
    }
  };

  const handleDelete = async (postId: string) => {
    const result = await deletePost(postId);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setPosts((current: any[]) => current.filter((post) => post.id !== postId));
    toast({ title: "Announcement deleted" });
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {canManage && (
        <form onSubmit={handlePost} className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-3">
          <p className="text-[13px] font-bold text-foreground">Post Announcement</p>
          <input
            value={newPost.title}
            onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
            placeholder="Announcement title…"
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <textarea
            value={newPost.content}
            onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))}
            placeholder="Write your announcement…"
            rows={3}
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] resize-none outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newPost.title.trim()}
              className="px-5 py-2 bg-crimson text-white rounded-xl text-[13px] font-medium hover:bg-crimson/90 disabled:opacity-50 transition-all shadow-md shadow-crimson/20"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-14">
          <div className="text-4xl opacity-30 mb-3">📣</div>
          <p className="font-display text-[17px] text-muted-foreground">No announcements yet</p>
        </div>
      ) : (
        posts.map((post: any, i: number) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
            className="bg-card border border-border rounded-2xl p-5 shadow-card"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={post.author?.image} />
                  <AvatarFallback className="text-[9px] font-bold bg-muted">{initials(post.author?.name)}</AvatarFallback>
                </Avatar>
                <span className="text-[12.5px] font-semibold text-foreground/80">{post.author?.name}</span>
                <span className="text-[11px] text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(post)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Edit announcement"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {editingPostId === post.id ? (
              <div className="space-y-3">
                <input
                  value={editPost.title}
                  onChange={(e) => setEditPost((current) => ({ ...current, title: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:bg-card focus:ring-2 focus:ring-crimson/10"
                />
                <textarea
                  value={editPost.content}
                  onChange={(e) => setEditPost((current) => ({ ...current, content: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:bg-card focus:ring-2 focus:ring-crimson/10"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingPostId(null)}
                    className="rounded-xl border border-border px-4 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(post.id)}
                    disabled={savingEdit}
                    className="rounded-xl bg-crimson px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-crimson/90 disabled:opacity-50"
                  >
                    {savingEdit ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="mb-1.5 text-[15px] font-bold text-foreground">{post.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-foreground/75">{post.content}</p>
              </>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function EventsTab({ club, canManage }: { club: any; canManage: boolean }) {
  const [events, setEvents] = useState(club.events);
  const [creating, setCreating] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    location: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startTime || !form.endTime) return;
    setCreating(true);
    const result = await createClubEvent(club.id, form);
    setCreating(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    if (result?.event) {
      setEvents((current: any[]) =>
        [...current, result.event].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
      );
      setForm({ title: "", location: "", description: "", startTime: "", endTime: "" });
      toast({ title: "Event created ✓" });
    }
  };

  const handleStartEdit = (evt: any) => {
    setEditingEventId(evt.id);
    setEditForm({
      title: evt.title ?? "",
      location: evt.location ?? "",
      description: evt.description ?? "",
      startTime: evt.startTime ? new Date(evt.startTime).toISOString().slice(0, 16) : "",
      endTime: evt.endTime ? new Date(evt.endTime).toISOString().slice(0, 16) : "",
    });
  };

  const handleSaveEdit = async (eventId: string) => {
    if (!editForm.title.trim() || !editForm.startTime || !editForm.endTime) return;
    setSavingEdit(true);
    const result = await updateClubEvent(eventId, editForm);
    setSavingEdit(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    if (result?.event) {
      setEvents((current: any[]) =>
        current
          .map((evt) => (evt.id === eventId ? result.event : evt))
          .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
      );
      setEditingEventId(null);
      toast({ title: "Event updated ✓" });
    }
  };

  const handleDelete = async (eventId: string) => {
    const result = await deleteClubEvent(eventId);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setEvents((current: any[]) => current.filter((evt) => evt.id !== eventId));
    toast({ title: "Event deleted" });
  };

  return (
    <div className="space-y-3 max-w-xl">
      {canManage && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-3">
          <p className="text-[13px] font-bold text-foreground">Create Event</p>
          <input
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            placeholder="Event title…"
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
            />
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((current) => ({ ...current, endTime: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
            />
          </div>
          <input
            value={form.location}
            onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
            placeholder="Location…"
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            placeholder="Add context for members…"
            rows={3}
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] resize-none outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !form.title.trim() || !form.startTime || !form.endTime}
              className="px-5 py-2 bg-crimson text-white rounded-xl text-[13px] font-medium hover:bg-crimson/90 disabled:opacity-50 transition-all shadow-md shadow-crimson/20"
            >
              {creating ? "Creating…" : "Create event"}
            </button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <div className="text-center py-14">
          <div className="text-4xl opacity-30 mb-3">📅</div>
          <p className="font-display text-[17px] text-muted-foreground">No upcoming events</p>
        </div>
      ) : (
        events.map((evt: any, i: number) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
            className="bg-card border border-border rounded-2xl p-4 shadow-card"
          >
            {editingEventId === evt.id ? (
              <div className="space-y-3">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((current) => ({ ...current, title: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:bg-card focus:ring-2 focus:ring-crimson/10"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="datetime-local"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm((current) => ({ ...current, startTime: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:bg-card focus:ring-2 focus:ring-crimson/10"
                  />
                  <input
                    type="datetime-local"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm((current) => ({ ...current, endTime: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:bg-card focus:ring-2 focus:ring-crimson/10"
                  />
                </div>
                <input
                  value={editForm.location}
                  onChange={(e) => setEditForm((current) => ({ ...current, location: e.target.value }))}
                  placeholder="Location…"
                  className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:bg-card focus:ring-2 focus:ring-crimson/10"
                />
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:bg-card focus:ring-2 focus:ring-crimson/10"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingEventId(null)} className="rounded-xl border border-border px-4 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted">
                    Cancel
                  </button>
                  <button onClick={() => handleSaveEdit(evt.id)} disabled={savingEdit} className="rounded-xl bg-crimson px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-crimson/90 disabled:opacity-50">
                    {savingEdit ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-crimson/8 flex flex-col items-center justify-center">
                  <span className="font-display text-[19px] font-semibold text-crimson leading-none">
                    {format(new Date(evt.startTime), "d")}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-crimson/60">
                    {format(new Date(evt.startTime), "MMM")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-foreground">{evt.title}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(evt.startTime), "h:mm a")}
                        </span>
                        {evt.location && (
                          <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {evt.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleStartEdit(evt)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Edit event">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(evt.id)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" aria-label="Delete event">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {evt.description && <p className="mt-1 text-[12px] text-muted-foreground line-clamp-1">{evt.description}</p>}
                </div>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
function MembersTab({
  clubId,
  slug,
  members,
  canManage,
  currentUserId,
  attendanceByUser,
}: {
  clubId: string;
  slug: string;
  members: any[];
  canManage: boolean;
  currentUserId: string;
  attendanceByUser: Record<string, any>;
}) {
  const [items, setItems] = useState(members);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRoleChange = async (memberUserId: string, nextRole: MembershipRole) => {
    setSavingMemberId(memberUserId);
    const result = await updateClubMemberRole(clubId, memberUserId, nextRole);
    setSavingMemberId(null);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setItems((current: any[]) => current.map((member) => (
      member.userId === memberUserId ? { ...member, role: nextRole } : member
    )));
    if (selectedMember?.userId === memberUserId) {
      setSelectedMember((current: any) => current ? { ...current, role: nextRole } : current);
    }
    toast({ title: "Member updated ✓" });
  };

  const handleRemove = async (memberUserId: string) => {
    setSavingMemberId(memberUserId);
    const result = await removeClubMember(clubId, memberUserId);
    setSavingMemberId(null);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setItems((current: any[]) => current.filter((member) => member.userId !== memberUserId));
    if (selectedMember?.userId === memberUserId) setSelectedMember(null);
    toast({ title: "Member removed" });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-[13px] font-bold text-foreground">Club roster</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Click a member to view their profile, contact details, and club attendance history.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((member: any, i: number) => {
            const summary = attendanceByUser[member.userId] ?? { total: 0, present: 0, late: 0, joined: 0, recent: [] };
            return (
              <motion.button
                key={member.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                onClick={() => setSelectedMember(member)}
                className="rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={member.user.image} />
                    <AvatarFallback className="bg-gradient-to-br from-navy to-crimson text-white text-xs font-bold">
                      {initials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">{member.user.name}</p>
                    <p className="text-[11px] text-muted-foreground">{getClubLeadershipRoleLabel(member.role)}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-muted/60 px-3 py-2">
                    <p className="text-[15px] font-semibold text-foreground">{summary.present}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Present</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 px-3 py-2">
                    <p className="text-[15px] font-semibold text-foreground">{summary.late}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Late</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 px-3 py-2">
                    <p className="text-[15px] font-semibold text-foreground">{summary.total}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Total</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full py-14 text-center">
              <div className="mb-3 text-4xl opacity-30">👥</div>
              <p className="font-display text-[17px] text-muted-foreground">No members yet</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedMember ? (
          <motion.div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="w-full max-w-3xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_30px_90px_rgba(15,23,42,0.2)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={selectedMember.user.image} />
                    <AvatarFallback className="bg-gradient-to-br from-navy to-crimson text-white text-sm font-bold">
                      {initials(selectedMember.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[1.3rem] font-semibold text-foreground">{selectedMember.user.name}</p>
                    <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">{getClubLeadershipRoleLabel(selectedMember.role)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="rounded-xl border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3 text-[13px] text-foreground"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedMember.user.email || "No email available"}</div>
                      <div className="flex items-center gap-3 text-[13px] text-foreground"><GraduationCap className="h-4 w-4 text-muted-foreground" /> Grade {selectedMember.user.grade ?? "Not set"}</div>
                      <div className="flex items-center gap-3 text-[13px] text-foreground"><UserRound className="h-4 w-4 text-muted-foreground" /> Joined {format(new Date(selectedMember.joinedAt), "MMM d, yyyy")}</div>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Leader actions</p>
                      <div className="mt-4 space-y-3">
                        <select
                          value={selectedMember.role}
                          onChange={(e) => handleRoleChange(selectedMember.userId, e.target.value as MembershipRole)}
                          disabled={savingMemberId === selectedMember.userId}
                          className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-[13px] outline-none"
                        >
                          {["MEMBER", "OFFICER", "PRESIDENT", "FACULTY_ADVISOR"].map((role) => (
                            <option key={role} value={role}>{getClubLeadershipRoleLabel(role as MembershipRole)}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemove(selectedMember.userId)}
                          disabled={savingMemberId === selectedMember.userId || selectedMember.userId === currentUserId}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Shield className="h-4 w-4" />
                          Remove from club
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Attendance in this club</p>
                  {(() => {
                    const summary = attendanceByUser[selectedMember.userId] ?? { total: 0, present: 0, late: 0, joined: 0, recent: [] };
                    return (
                      <>
                        <div className="mt-4 grid grid-cols-4 gap-3">
                          {[
                            { label: "Total", value: summary.total },
                            { label: "Present", value: summary.present },
                            { label: "Late", value: summary.late },
                            { label: "Pending", value: summary.joined },
                          ].map((item) => (
                            <div key={item.label} className="rounded-xl bg-muted/60 px-3 py-3 text-center">
                              <p className="text-[1.05rem] font-semibold text-foreground">{item.value}</p>
                              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 space-y-3">
                          {summary.recent.length === 0 ? (
                            <p className="rounded-xl bg-muted/50 px-4 py-4 text-[13px] text-muted-foreground">No attendance records yet.</p>
                          ) : summary.recent.map((record: any) => (
                            <div key={`${record.session.id}-${record.joinedAt}`} className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[13px] font-semibold text-foreground">{record.session.title}</p>
                                  <p className="text-[11.5px] text-muted-foreground">{format(new Date(record.session.date), "MMM d, yyyy")}</p>
                                </div>
                                <span className="rounded-full bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                  {record.status.toLowerCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

// ─── Workspace Tab ────────────────────────────────────────────────────────────
function WorkspaceTab({
  club,
  resources,
  canManage,
  canAccessWorkspace,
}: {
  club: any;
  resources: any[];
  canManage: boolean;
  canAccessWorkspace: boolean;
}) {
  const typeIcon: Record<string, string> = {
    LINK: "🔗", DOCUMENT: "📄", PDF: "📋", SPREADSHEET: "📊", VIDEO: "🎬", OTHER: "📁",
  };
  const categoryLabel: Record<string, string> = {
    RESOURCE: "Material",
    ASSIGNMENT: "Assignment",
    FORM: "Form",
  };
  const [items, setItems] = useState(resources);
  const [workspaceMeta, setWorkspaceMeta] = useState({
    workspaceTitle: club.workspaceTitle ?? "",
    workspaceDescription: club.workspaceDescription ?? "",
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    type: "LINK",
    category: "RESOURCE",
    dueAt: "",
    membersOnly: true,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    url: "",
    description: "",
    type: "LINK",
    category: "RESOURCE",
    dueAt: "",
    membersOnly: true,
  });
  const { toast } = useToast();

  if (!canAccessWorkspace) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
        <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-4 font-display text-[20px] text-foreground">Members-only workspace</p>
        <p className="mt-2 text-[13.5px] text-muted-foreground">Join this club to access assignments, forms, and shared materials.</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    setCreating(true);
    const result = await createClubResource(club.id, { ...form, dueAt: form.dueAt || null } as any);
    setCreating(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    if (result?.resource) {
      setItems((current: any[]) => [result.resource, ...current]);
      setForm({ name: "", url: "", description: "", type: "LINK", category: "RESOURCE", dueAt: "", membersOnly: true });
      toast({ title: "Workspace item added ✓" });
    }
  };

  const handleStartEdit = (resource: any) => {
    setEditingResourceId(resource.id);
    setEditForm({
      name: resource.name ?? "",
      url: resource.url ?? "",
      description: resource.description ?? "",
      type: resource.type ?? "LINK",
      category: resource.category ?? "RESOURCE",
      dueAt: resource.dueAt ? new Date(resource.dueAt).toISOString().slice(0, 16) : "",
      membersOnly: resource.membersOnly ?? true,
    });
  };

  const handleSaveEdit = async (resourceId: string) => {
    if (!editForm.name.trim() || !editForm.url.trim()) return;
    setSavingEdit(true);
    const result = await updateClubResource(resourceId, { ...editForm, dueAt: editForm.dueAt || null } as any);
    setSavingEdit(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    if (result?.resource) {
      setItems((current: any[]) => current.map((item) => (item.id === resourceId ? result.resource : item)));
      setEditingResourceId(null);
      toast({ title: "Workspace item updated ✓" });
    }
  };

  const handleDelete = async (resourceId: string) => {
    const result = await deleteClubResource(resourceId);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setItems((current: any[]) => current.filter((item) => item.id !== resourceId));
    toast({ title: "Workspace item deleted" });
  };

  const handleWorkspaceSave = async () => {
    setSavingMeta(true);
    const result = await updateClubWorkspace(club.id, workspaceMeta);
    setSavingMeta(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Workspace updated ✓" });
  };

  const groupedItems = {
    assignments: items.filter((item: any) => item.category === "ASSIGNMENT"),
    forms: items.filter((item: any) => item.category === "FORM"),
    materials: items.filter((item: any) => item.category === "RESOURCE"),
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.8rem] border border-border bg-card p-5 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
        {canManage ? (
          <div className="mt-4 grid gap-3">
            <input value={workspaceMeta.workspaceTitle} onChange={(e) => setWorkspaceMeta((current) => ({ ...current, workspaceTitle: e.target.value }))} placeholder="Workspace title" className="w-full rounded-xl border border-transparent bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:border-border focus:bg-card" />
            <textarea value={workspaceMeta.workspaceDescription} onChange={(e) => setWorkspaceMeta((current) => ({ ...current, workspaceDescription: e.target.value }))} placeholder="Describe how this club uses its member workspace…" rows={3} className="w-full rounded-xl border border-transparent bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:border-border focus:bg-card" />
            <div className="flex justify-end">
              <button onClick={handleWorkspaceSave} disabled={savingMeta} className="rounded-xl bg-crimson px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-crimson/90 disabled:opacity-50">
                {savingMeta ? "Saving…" : "Save workspace"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 font-display text-[1.5rem] text-foreground">{club.workspaceTitle || `${club.name} workspace`}</p>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-6 text-muted-foreground">{club.workspaceDescription || "Shared assignments, forms, and club materials live here for active members."}</p>
          </>
        )}
      </div>

      {canManage ? (
        <form onSubmit={handleCreate} className="rounded-[1.8rem] border border-border bg-card p-5 shadow-card space-y-3">
          <p className="text-[13px] font-bold text-foreground">Add workspace item</p>
          <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Item title…" className="w-full rounded-xl border border-transparent bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:border-border focus:bg-card" />
            <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="w-full rounded-xl border border-transparent bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:border-border focus:bg-card">
              <option value="RESOURCE">Material</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="FORM">Form</option>
            </select>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_180px]">
            <input value={form.url} onChange={(e) => setForm((current) => ({ ...current, url: e.target.value }))} placeholder="https://…" className="w-full rounded-xl border border-transparent bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:border-border focus:bg-card" />
            <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))} className="w-full rounded-xl border border-transparent bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:border-border focus:bg-card">
              {Object.keys(typeIcon).map((type) => (
                <option key={type} value={type}>{type.toLowerCase()}</option>
              ))}
            </select>
            <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm((current) => ({ ...current, dueAt: e.target.value }))} className="w-full rounded-xl border border-transparent bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:border-border focus:bg-card" />
          </div>
          <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Add notes or instructions…" rows={3} className="w-full rounded-xl border border-transparent bg-muted px-4 py-2.5 text-[13.5px] outline-none focus:border-border focus:bg-card" />
          <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <input type="checkbox" checked={form.membersOnly} onChange={(e) => setForm((current) => ({ ...current, membersOnly: e.target.checked }))} />
            Limit this item to club members
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={creating || !form.name.trim() || !form.url.trim()} className="rounded-xl bg-crimson px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-crimson/90 disabled:opacity-50">
              {creating ? "Adding…" : "Add item"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        {[
          { title: "Assignments", items: groupedItems.assignments },
          { title: "Forms", items: groupedItems.forms },
          { title: "Materials", items: groupedItems.materials },
        ].map((section) => (
          <div key={section.title} className="rounded-[1.8rem] border border-border bg-card p-4 shadow-card">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{section.title}</p>
            <div className="mt-4 space-y-3">
              {section.items.length === 0 ? (
                <p className="rounded-xl bg-muted/50 px-4 py-4 text-[12.5px] text-muted-foreground">Nothing posted yet.</p>
              ) : section.items.map((resource: any) => (
                <div key={resource.id} className="rounded-xl border border-border bg-muted/30 p-3">
                  {editingResourceId === resource.id ? (
                    <div className="space-y-3">
                      <input value={editForm.name} onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] outline-none" />
                      <div className="grid gap-3">
                        <input value={editForm.url} onChange={(e) => setEditForm((current) => ({ ...current, url: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] outline-none" />
                        <div className="grid gap-3 sm:grid-cols-3">
                          <select value={editForm.category} onChange={(e) => setEditForm((current) => ({ ...current, category: e.target.value }))} className="rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] outline-none">
                            <option value="RESOURCE">Material</option>
                            <option value="ASSIGNMENT">Assignment</option>
                            <option value="FORM">Form</option>
                          </select>
                          <select value={editForm.type} onChange={(e) => setEditForm((current) => ({ ...current, type: e.target.value }))} className="rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] outline-none">
                            {Object.keys(typeIcon).map((type) => (
                              <option key={type} value={type}>{type.toLowerCase()}</option>
                            ))}
                          </select>
                          <input type="datetime-local" value={editForm.dueAt} onChange={(e) => setEditForm((current) => ({ ...current, dueAt: e.target.value }))} className="rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] outline-none" />
                        </div>
                      </div>
                      <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] outline-none" />
                      <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <input type="checkbox" checked={editForm.membersOnly} onChange={(e) => setEditForm((current) => ({ ...current, membersOnly: e.target.checked }))} />
                        Members only
                      </label>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingResourceId(null)} className="rounded-xl border border-border px-4 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted">Cancel</button>
                        <button onClick={() => handleSaveEdit(resource.id)} disabled={savingEdit} className="rounded-xl bg-crimson px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-crimson/90 disabled:opacity-50">
                          {savingEdit ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold text-foreground">{resource.name}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{categoryLabel[resource.category]} · {typeIcon[resource.type] ?? "📁"} {resource.type.toLowerCase()}</p>
                        </a>
                        {canManage ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleStartEdit(resource)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(resource.id)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : null}
                      </div>
                      {resource.description ? <p className="text-[12.5px] leading-5 text-muted-foreground">{resource.description}</p> : null}
                      <div className="flex flex-wrap gap-2">
                        {resource.membersOnly ? <span className="rounded-full bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Members only</span> : null}
                        {resource.dueAt ? <span className="rounded-full bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Due {format(new Date(resource.dueAt), "MMM d")}</span> : null}
                      </div>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-medium text-crimson">
                        Open item <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────
function ApplicationsTab({ club, userId }: { club: any; userId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const existingApp = club.applications?.[0];
  const form = club.appForm;

  if (existingApp) {
    const statusUI: Record<string, { icon: any; color: string; label: string }> = {
      SUBMITTED:     { icon: AlertCircle,  color: "text-amber-600",   label: "Application Submitted" },
      UNDER_REVIEW:  { icon: AlertCircle,  color: "text-blue-600",    label: "Under Review" },
      ACCEPTED:      { icon: CheckCircle,  color: "text-emerald-600", label: "Accepted" },
      REJECTED:      { icon: XCircle,      color: "text-red-600",     label: "Not Accepted" },
      WAITLISTED:    { icon: AlertCircle,  color: "text-purple-600",  label: "Waitlisted" },
    };
    const ui = statusUI[existingApp.status] ?? statusUI.SUBMITTED;
    return (
      <div className="max-w-md">
        <div className={cn("flex items-center gap-3 p-5 bg-card border border-border rounded-2xl shadow-card", ui.color)}>
          <ui.icon className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[15px]">{ui.label}</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Submitted {formatRelativeTime(existingApp.createdAt)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 max-w-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="font-display text-[22px] font-semibold text-foreground">Application Submitted</h3>
        <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">
          Your application to {club.name} has been received. You&apos;ll hear back within 2 weeks.
        </p>
      </motion.div>
    );
  }

  if (!form || !form.isOpen) {
    return (
      <div className="text-center py-14">
        <div className="text-4xl opacity-30 mb-3">🔒</div>
        <p className="font-display text-[17px] text-muted-foreground">Applications are closed</p>
      </div>
    );
  }

  const fields: any[] = Array.isArray(form.fields) ? form.fields : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitApplication(club.id, responses);
    setSubmitting(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="bg-crimson/5 border border-crimson/15 rounded-2xl p-5">
        <p className="text-[11px] font-bold uppercase tracking-[.08em] text-crimson mb-1.5">Applications Open</p>
        <p className="text-[13px] text-foreground/75 leading-relaxed">
          Submit your application to join {club.name}. All applications are reviewed by club leadership.
          {form.deadline && ` Deadline: ${format(new Date(form.deadline), "MMMM d, yyyy")}.`}
        </p>
      </div>

      {fields.map((field: any) => (
        <div key={field.id} className="space-y-1.5">
          <label className="text-[12.5px] font-semibold text-foreground/80">
            {field.label}
            {field.required && <span className="text-crimson ml-1">*</span>}
          </label>
          {field.type === "textarea" ? (
            <textarea
              required={field.required}
              placeholder={field.placeholder ?? ""}
              value={responses[field.id] ?? ""}
              onChange={(e) => setResponses((r) => ({ ...r, [field.id]: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] resize-none outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/10 transition-all"
            />
          ) : field.type === "select" ? (
            <select
              required={field.required}
              value={responses[field.id] ?? ""}
              onChange={(e) => setResponses((r) => ({ ...r, [field.id]: e.target.value }))}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] outline-none focus:border-crimson transition-all"
            >
              <option value="">Select…</option>
              {(field.options ?? []).map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === "email" ? "email" : "text"}
              required={field.required}
              placeholder={field.placeholder ?? ""}
              value={responses[field.id] ?? ""}
              onChange={(e) => setResponses((r) => ({ ...r, [field.id]: e.target.value }))}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/10 transition-all"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-crimson text-white rounded-xl text-[14px] font-medium hover:bg-crimson/90 disabled:opacity-50 transition-all shadow-lg shadow-crimson/25"
      >
        {submitting ? "Submitting…" : "Submit Application →"}
      </button>
    </form>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[.09em] text-muted-foreground/60 mb-3 pb-2.5 border-b border-border">
        {label}
      </p>
      {children}
    </div>
  );
}
