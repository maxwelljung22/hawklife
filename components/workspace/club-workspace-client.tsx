"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Columns3,
  FileText,
  FolderOpen,
  Heart,
  LayoutGrid,
  List,
  MessageSquare,
  Palette,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { normalizeHttpsUrl, normalizeThemeColor } from "@/lib/sanitize";
import { cn, formatRelativeTime, initials } from "@/lib/utils";
import {
  createWorkspaceAssignment,
  createWorkspaceComment,
  createWorkspacePost,
  createWorkspaceResource,
  createWorkspaceTask,
  markAssignmentComplete,
  submitWorkspaceAssignment,
  toggleWorkspaceReaction,
  updateWorkspaceSettings,
  updateWorkspaceTaskStatus,
} from "@/app/(app)/clubs/[slug]/workspace/actions";

const TABS = [
  { id: "stream", label: "Stream", icon: MessageSquare },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "tasks", label: "Tasks", icon: Columns3 },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "members", label: "Members", icon: Users },
  { id: "customize", label: "Customize", icon: Palette },
] as const;

const TASK_COLUMNS = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "COMPLETED", label: "Completed" },
] as const;

type WorkspaceTab = (typeof TABS)[number]["id"];

type WorkspaceProps = {
  club: any;
  currentUserId: string;
  isLeader: boolean;
  streamPosts: any[];
  assignments: any[];
  tasks: any[];
  resources: any[];
  members: any[];
};

function parseAttachmentInput(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getSafeThemeColor(value: string, fallback: string) {
  return normalizeThemeColor(value) ?? fallback;
}

function WorkspaceSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.8rem] border border-border/80 bg-card/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.04em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
            {title}
          </h2>
          <p className="mt-1 text-[13.5px] leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/35 px-6 py-12 text-center">
      <p className="text-[1rem] font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function AttachmentsList({ attachments }: { attachments?: { url: string; label?: string }[] | null }) {
  const safeAttachments = (attachments ?? []).filter((attachment) => normalizeHttpsUrl(attachment.url));
  if (!safeAttachments.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {safeAttachments.map((attachment, index) => (
        <a
          key={`${attachment.url}-${index}`}
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          {attachment.label || attachment.url}
        </a>
      ))}
    </div>
  );
}

export function ClubWorkspaceClient({
  club,
  currentUserId,
  isLeader,
  streamPosts,
  assignments,
  tasks: initialTasks,
  resources,
  members,
}: WorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("stream");
  const [isPending, startTransition] = useTransition();
  const [taskItems, setTaskItems] = useState(initialTasks);
  const [resourceView, setResourceView] = useState<"grid" | "list">("grid");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const handleTaskDrop = useCallback(
    async (taskId: string, status: "TODO" | "IN_PROGRESS" | "COMPLETED") => {
      const previous = taskItems;
      setTaskItems((current: any[]) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));
      const result = await updateWorkspaceTaskStatus(taskId, status);
      if (result?.error) {
        setTaskItems(previous);
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Task updated" });
      refresh();
    },
    [refresh, taskItems, toast]
  );

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "stream":
        return (
          <StreamTab
            clubId={club.id}
            currentUserId={currentUserId}
            isLeader={isLeader}
            posts={streamPosts}
            onRefresh={refresh}
          />
        );
      case "assignments":
        return (
          <AssignmentsTab
            clubId={club.id}
            currentUserId={currentUserId}
            isLeader={isLeader}
            assignments={assignments}
            onRefresh={refresh}
          />
        );
      case "tasks":
        return (
          <TasksTab
            isLeader={isLeader}
            clubId={club.id}
            tasks={taskItems}
            members={members}
            draggingTaskId={draggingTaskId}
            onDragStart={setDraggingTaskId}
            onDrop={handleTaskDrop}
            onRefresh={refresh}
          />
        );
      case "resources":
        return (
          <ResourcesTab
            clubId={club.id}
            isLeader={isLeader}
            resources={resources}
            resourceView={resourceView}
            onChangeView={setResourceView}
            onRefresh={refresh}
          />
        );
      case "members":
        return <MembersTab members={members} />;
      case "customize":
        return <CustomizeTab club={club} isLeader={isLeader} onRefresh={refresh} />;
      default:
        return null;
    }
  }, [activeTab, assignments, club, currentUserId, draggingTaskId, handleTaskDrop, isLeader, members, refresh, resourceView, resources, streamPosts, taskItems]);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }} className="space-y-6">
      <div className="sticky top-[88px] z-20 rounded-[1.8rem] border border-border/80 bg-card/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link href={`/clubs/${club.slug}`} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground">
              {club.name}
            </Link>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[2rem] leading-none">{club.emoji}</span>
              <div>
                <h1 className="text-balance text-[clamp(1.8rem,4vw,2.9rem)] font-semibold tracking-[-0.05em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
                  {club.workspaceTitle || `${club.name} Workspace`}
                </h1>
                <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
                  {club.workspaceDescription || "Announcements, assignments, task progress, and club resources live together here."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
              {members.length} active members
            </div>
            <Link href={`/clubs/${club.slug}`} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
              Back to club
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[220px] lg:h-fit">
          <div className="rounded-[1.8rem] border border-border/80 bg-card/90 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <nav className="space-y-1.5">
              {TABS.filter((tab) => tab.id !== "customize" || isLeader).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-neutral-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)] dark:bg-white dark:text-neutral-950"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            >
              {tabContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function StreamTab({
  clubId,
  currentUserId,
  isLeader,
  posts,
  onRefresh,
}: {
  clubId: string;
  currentUserId: string;
  isLeader: boolean;
  posts: any[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ content: "", attachments: "" });
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const composerRef = useRef<HTMLFormElement | null>(null);

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createWorkspacePost(clubId, {
      content: form.content,
      attachments: parseAttachmentInput(form.attachments),
    });
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setForm({ content: "", attachments: "" });
    toast({ title: "Update posted" });
    onRefresh();
  };

  const sendComment = async (postId: string) => {
    const result = await createWorkspaceComment(postId, commentDrafts[postId] ?? "");
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    onRefresh();
  };

  const toggleReaction = (postId: string) => {
    startTransition(async () => {
      const result = await toggleWorkspaceReaction(postId);
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      onRefresh();
    });
  };

  return (
    <div className="space-y-5">
      <WorkspaceSection
        title="Stream"
        description="A clean feed for leader updates, links, and quick discussion."
      >
        {isLeader ? (
          <form ref={composerRef} onSubmit={submitPost} className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4 sm:p-5">
            <textarea
              value={form.content}
              onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))}
              placeholder="Share an update with your club"
              rows={4}
              className="w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] leading-6 outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
            />
            <textarea
              value={form.attachments}
              onChange={(e) => setForm((current) => ({ ...current, attachments: e.target.value }))}
              placeholder="Attachment links, one per line"
              rows={2}
              className="mt-3 w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[13px] leading-6 outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
            />
            <div className="mt-4 flex justify-end">
              <Button type="submit">
                <Send className="h-4 w-4" />
                Post update
              </Button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 space-y-4">
          {posts.length === 0 ? (
            <EmptyState
              title="No stream posts yet"
              description="The stream stays focused and chronological. When leaders post the first update, it will show up here."
              action={
                isLeader ? (
                  <Button type="button" onClick={() => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                    Post the first update
                  </Button>
                ) : undefined
              }
            />
          ) : (
            posts.map((post) => {
              const userHasReacted = post.reactions.some((reaction: any) => reaction.userId === currentUserId);
              return (
                <motion.article
                  key={post.id}
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-[1.5rem] border border-border/80 bg-background/75 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author?.image ?? undefined} />
                      <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                        {initials(post.author?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{post.author?.name}</p>
                      <p className="text-[12px] text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-[14px] leading-7 text-foreground/78">{post.content}</p>
                  <AttachmentsList attachments={post.attachments as any} />

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleReaction(post.id)}
                      disabled={isPending}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-all duration-200",
                        userHasReacted
                          ? "border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))/0.08] text-[hsl(var(--primary))]"
                          : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:text-foreground"
                      )}
                    >
                      <Heart className={cn("h-3.5 w-3.5", userHasReacted && "fill-current")} />
                      {post.reactions.length}
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[12px] font-medium text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.comments.length}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} className="rounded-[1.2rem] bg-muted/45 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-foreground">{comment.author?.name}</span>
                          <span className="text-[11px] text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-[13px] leading-6 text-foreground/72">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      value={commentDrafts[post.id] ?? ""}
                      onChange={(e) => setCommentDrafts((current) => ({ ...current, [post.id]: e.target.value }))}
                      placeholder="Add a comment"
                      className="flex-1 rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[13px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
                    />
                    <Button type="button" variant="secondary" onClick={() => sendComment(post.id)}>
                      Reply
                    </Button>
                  </div>
                </motion.article>
              );
            })
          )}
        </div>
      </WorkspaceSection>
    </div>
  );
}

function AssignmentsTab({
  clubId,
  currentUserId,
  isLeader,
  assignments,
  onRefresh,
}: {
  clubId: string;
  currentUserId: string;
  isLeader: boolean;
  assignments: any[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", description: "", dueAt: "", attachments: "" });
  const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, { content: string; attachments: string }>>({});
  const formRef = useRef<HTMLFormElement | null>(null);

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createWorkspaceAssignment(clubId, {
      title: form.title,
      description: form.description,
      dueAt: form.dueAt || null,
      attachments: parseAttachmentInput(form.attachments),
    });
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setForm({ title: "", description: "", dueAt: "", attachments: "" });
    toast({ title: "Assignment created" });
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <WorkspaceSection title="Assignments" description="Run club work like a real product team: clear briefs, due dates, and fast submissions.">
        {isLeader ? (
          <form ref={formRef} onSubmit={createAssignment} className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
              <input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="Assignment title" className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
              <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm((current) => ({ ...current, dueAt: e.target.value }))} className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
            </div>
            <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Describe what members need to do" rows={4} className="mt-3 w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] leading-6 outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
            <textarea value={form.attachments} onChange={(e) => setForm((current) => ({ ...current, attachments: e.target.value }))} placeholder="Attachment links, one per line" rows={2} className="mt-3 w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[13px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
            <div className="mt-4 flex justify-end">
              <Button type="submit">
                <Plus className="h-4 w-4" />
                Create assignment
              </Button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet"
              description="Create one clear assignment to kick off the workspace and keep everyone aligned."
              action={
                isLeader ? (
                  <Button type="button" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                    Create your first assignment
                  </Button>
                ) : undefined
              }
            />
          ) : (
            assignments.map((assignment) => {
              const submission = assignment.submissions.find((item: any) => item.userId === currentUserId);
              const isLate = !submission?.submittedAt && assignment.dueAt && new Date(assignment.dueAt) < new Date();
              const status = submission?.submittedAt ? "Submitted" : isLate ? "Late" : "Assigned";

              return (
                <article key={assignment.id} className="rounded-[1.5rem] border border-border/80 bg-background/75 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[1.05rem] font-semibold text-foreground">{assignment.title}</h3>
                        <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", status === "Submitted" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : status === "Late" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : "bg-muted text-muted-foreground")}>
                          {status}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-[14px] leading-7 text-foreground/76">{assignment.description}</p>
                      <p className="mt-3 text-[12px] text-muted-foreground">
                        {assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleString()}` : "No due date"}
                      </p>
                      <AttachmentsList attachments={assignment.attachments as any} />
                    </div>
                    <div className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-right">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Submissions</p>
                      <p className="mt-1 text-[1.2rem] font-semibold text-foreground">{assignment.submissions.length}</p>
                    </div>
                  </div>

                  {!isLeader ? (
                    <div className="mt-5 rounded-[1.3rem] border border-border bg-card p-4">
                      <textarea
                        value={submissionDrafts[assignment.id]?.content ?? submission?.content ?? ""}
                        onChange={(e) => setSubmissionDrafts((current) => ({ ...current, [assignment.id]: { content: e.target.value, attachments: current[assignment.id]?.attachments ?? "" } }))}
                        placeholder="Add your response or submission notes"
                        rows={3}
                        className="w-full rounded-[1.1rem] border border-border bg-background px-4 py-3 text-[13px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
                      />
                      <textarea
                        value={submissionDrafts[assignment.id]?.attachments ?? ""}
                        onChange={(e) => setSubmissionDrafts((current) => ({ ...current, [assignment.id]: { content: current[assignment.id]?.content ?? "", attachments: e.target.value } }))}
                        placeholder="Submission links, one per line"
                        rows={2}
                        className="mt-3 w-full rounded-[1.1rem] border border-border bg-background px-4 py-3 text-[13px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
                      />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          onClick={async () => {
                            const draft = submissionDrafts[assignment.id] ?? { content: "", attachments: "" };
                            const result = await submitWorkspaceAssignment(assignment.id, {
                              content: draft.content,
                              attachments: parseAttachmentInput(draft.attachments),
                            });
                            if (result?.error) {
                              toast({ title: "Error", description: result.error, variant: "destructive" });
                              return;
                            }
                            toast({ title: "Assignment submitted" });
                            onRefresh();
                          }}
                        >
                          Submit work
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            const result = await markAssignmentComplete(assignment.id);
                            if (result?.error) {
                              toast({ title: "Error", description: result.error, variant: "destructive" });
                              return;
                            }
                            toast({ title: "Marked complete" });
                            onRefresh();
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark complete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </WorkspaceSection>
    </div>
  );
}

function TasksTab({
  clubId,
  isLeader,
  tasks,
  members,
  draggingTaskId,
  onDragStart,
  onDrop,
  onRefresh,
}: {
  clubId: string;
  isLeader: boolean;
  tasks: any[];
  members: any[];
  draggingTaskId: string | null;
  onDragStart: (taskId: string | null) => void;
  onDrop: (taskId: string, status: "TODO" | "IN_PROGRESS" | "COMPLETED") => Promise<void>;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", description: "", assigneeId: "", dueAt: "" });
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <WorkspaceSection title="Task Board" description="Keep club work moving with a fast, drag-and-drop board.">
      {isLeader ? (
        <form
          ref={formRef}
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await createWorkspaceTask(clubId, {
              title: form.title,
              description: form.description,
              assigneeId: form.assigneeId || null,
              dueAt: form.dueAt || null,
            });
            if (result?.error) {
              toast({ title: "Error", description: result.error, variant: "destructive" });
              return;
            }
            setForm({ title: "", description: "", assigneeId: "", dueAt: "" });
            toast({ title: "Task created" });
            onRefresh();
          }}
          className="mb-5 rounded-[1.5rem] border border-border/80 bg-background/80 p-4 sm:p-5"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="Task title" className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
            <select value={form.assigneeId} onChange={(e) => setForm((current) => ({ ...current, assigneeId: e.target.value }))} className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson">
              <option value="">No assignee</option>
              {members.map((member) => (
                <option key={member.user.id} value={member.user.id}>{member.user.name}</option>
              ))}
            </select>
            <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm((current) => ({ ...current, dueAt: e.target.value }))} className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
          </div>
          <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Task description" rows={3} className="mt-3 w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
          <div className="mt-4 flex justify-end">
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {TASK_COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);
          return (
            <div
              key={column.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async () => {
                if (draggingTaskId) {
                  await onDrop(draggingTaskId, column.id);
                  onDragStart(null);
                }
              }}
              className="rounded-[1.5rem] border border-border/80 bg-background/75 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[0.98rem] font-semibold text-foreground">{column.label}</p>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {columnTasks.length === 0 ? (
                  <EmptyState
                    title={`No ${column.label.toLowerCase()} tasks`}
                    description="Add one and move it here when the work starts."
                    action={
                      isLeader && column.id === "TODO" ? (
                        <Button type="button" variant="secondary" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                          Create first task
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      draggable
                      whileHover={{ scale: 1.02, y: -2 }}
                      onDragStart={() => onDragStart(task.id)}
                      className="cursor-grab rounded-[1.25rem] border border-border bg-card p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                    >
                      <p className="text-[14px] font-semibold text-foreground">{task.title}</p>
                      {task.description ? <p className="mt-2 text-[12.5px] leading-6 text-muted-foreground">{task.description}</p> : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {task.assignee ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={task.assignee.image ?? undefined} />
                              <AvatarFallback className="text-[8px]">{initials(task.assignee.name)}</AvatarFallback>
                            </Avatar>
                            {task.assignee.name}
                          </span>
                        ) : null}
                        {task.dueAt ? (
                          <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                            Due {new Date(task.dueAt).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </WorkspaceSection>
  );
}

function ResourcesTab({
  clubId,
  isLeader,
  resources,
  resourceView,
  onChangeView,
  onRefresh,
}: {
  clubId: string;
  isLeader: boolean;
  resources: any[];
  resourceView: "grid" | "list";
  onChangeView: (view: "grid" | "list") => void;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", url: "", description: "", category: "RESOURCE", type: "LINK" });
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <WorkspaceSection
      title="Resources"
      description="Shared links, docs, and club materials in one clean library."
      action={
        <div className="inline-flex rounded-2xl border border-border bg-background/80 p-1">
          <button onClick={() => onChangeView("grid")} className={cn("rounded-xl px-3 py-2 text-sm transition-all duration-200", resourceView === "grid" ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "text-muted-foreground hover:text-foreground")}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => onChangeView("list")} className={cn("rounded-xl px-3 py-2 text-sm transition-all duration-200", resourceView === "list" ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "text-muted-foreground hover:text-foreground")}>
            <List className="h-4 w-4" />
          </button>
        </div>
      }
    >
      {isLeader ? (
        <form
          ref={formRef}
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await createWorkspaceResource(clubId, form as any);
            if (result?.error) {
              toast({ title: "Error", description: result.error, variant: "destructive" });
              return;
            }
            setForm({ name: "", url: "", description: "", category: "RESOURCE", type: "LINK" });
            toast({ title: "Resource added" });
            onRefresh();
          }}
          className="mb-5 rounded-[1.5rem] border border-border/80 bg-background/80 p-4 sm:p-5"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Resource title" className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
            <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson">
              <option value="RESOURCE">Material</option>
              <option value="FORM">Form</option>
              <option value="ASSIGNMENT">Reference</option>
            </select>
            <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))} className="rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson">
              <option value="LINK">Link</option>
              <option value="DOCUMENT">Document</option>
              <option value="PDF">PDF</option>
              <option value="SPREADSHEET">Spreadsheet</option>
              <option value="VIDEO">Video</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <input value={form.url} onChange={(e) => setForm((current) => ({ ...current, url: e.target.value }))} placeholder="Paste the resource URL" className="mt-3 w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
          <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Add a short note" rows={3} className="mt-3 w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
          <div className="mt-4 flex justify-end">
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Add resource
            </Button>
          </div>
        </form>
      ) : null}

      {resources.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="No shared materials yet — add the first one to give members a central source of truth."
          action={
            isLeader ? (
              <Button type="button" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                Add the first resource
              </Button>
            ) : undefined
          }
        />
      ) : resourceView === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => {
            const resourceUrl = normalizeHttpsUrl(resource.url);
            if (!resourceUrl) return null;

            return (
              <a key={resource.id} href={resourceUrl} target="_blank" rel="noopener noreferrer" className="group rounded-[1.5rem] border border-border/80 bg-background/75 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{resource.category}</p>
                <p className="mt-3 text-[1rem] font-semibold text-foreground group-hover:text-[hsl(var(--primary))]">{resource.name}</p>
                {resource.description ? <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{resource.description}</p> : null}
                <p className="mt-4 text-[12px] text-muted-foreground">{resource.type.toLowerCase()}</p>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => {
            const resourceUrl = normalizeHttpsUrl(resource.url);
            if (!resourceUrl) return null;

            return (
              <a key={resource.id} href={resourceUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-[1.4rem] border border-border/80 bg-background/75 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
                <div>
                  <p className="text-[0.98rem] font-semibold text-foreground group-hover:text-[hsl(var(--primary))]">{resource.name}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{resource.category} · {resource.type.toLowerCase()}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            );
          })}
        </div>
      )}
    </WorkspaceSection>
  );
}

function MembersTab({ members }: { members: any[] }) {
  return (
    <WorkspaceSection title="Members" description="A clean roster with clear roles and zero clutter.">
      {members.length === 0 ? (
        <EmptyState title="No members yet" description="As your club grows, everyone in the workspace will appear here automatically." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-4 rounded-[1.5rem] border border-border/80 bg-background/75 p-4">
              <Avatar className="h-11 w-11">
                <AvatarImage src={member.user.image ?? undefined} />
                <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">{initials(member.user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-[0.98rem] font-semibold text-foreground">{member.user.name}</p>
                <p className="text-[12.5px] text-muted-foreground">{member.role === "MEMBER" ? "Member" : member.role.replace("_", " ")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceSection>
  );
}

function CustomizeTab({
  club,
  isLeader,
  onRefresh,
}: {
  club: any;
  isLeader: boolean;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    workspaceTitle: club.workspaceTitle ?? `${club.name} Workspace`,
    workspaceDescription: club.workspaceDescription ?? "",
    bannerUrl: normalizeHttpsUrl(club.bannerUrl) ?? "",
    gradientFrom: getSafeThemeColor(club.gradientFrom, "#1a3a6e"),
    gradientTo: getSafeThemeColor(club.gradientTo, "#0c2a52"),
  });
  const previewBannerUrl = normalizeHttpsUrl(form.bannerUrl);
  const previewGradientFrom = getSafeThemeColor(form.gradientFrom, "#1a3a6e");
  const previewGradientTo = getSafeThemeColor(form.gradientTo, "#0c2a52");

  if (!isLeader) {
    return <EmptyState title="Leaders can customize the workspace" description="Accent color, banner image, and workspace messaging are controlled by club leaders." />;
  }

  return (
    <WorkspaceSection title="Customize" description="Adjust the banner, accent, and workspace copy without making the interface heavy.">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.6rem] border border-border/80 bg-background/75 p-5">
          <div
            className="rounded-[1.4rem] p-6 text-white"
            style={{
              background: previewBannerUrl
                ? `linear-gradient(135deg, rgba(0,0,0,0.56), rgba(0,0,0,0.24)), url(${previewBannerUrl}) center/cover`
                : `linear-gradient(135deg, ${previewGradientFrom}, ${previewGradientTo})`,
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Preview</p>
            <p className="mt-4 text-[1.4rem] font-semibold tracking-[-0.04em] text-white" style={{ fontFamily: "Inter, var(--font-body)" }}>
              {form.workspaceTitle}
            </p>
            <p className="mt-3 text-[13px] leading-6 text-white/78">
              {form.workspaceDescription || "Your workspace description will appear here."}
            </p>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await updateWorkspaceSettings(club.id, form);
            if (result?.error) {
              toast({ title: "Error", description: result.error, variant: "destructive" });
              return;
            }
            toast({ title: "Workspace updated" });
            onRefresh();
          }}
          className="space-y-3 rounded-[1.6rem] border border-border/80 bg-background/75 p-5"
        >
          <input value={form.workspaceTitle} onChange={(e) => setForm((current) => ({ ...current, workspaceTitle: e.target.value }))} placeholder="Workspace title" className="w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
          <textarea value={form.workspaceDescription} onChange={(e) => setForm((current) => ({ ...current, workspaceDescription: e.target.value }))} placeholder="Workspace description" rows={4} className="w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
          <input value={form.bannerUrl} onChange={(e) => setForm((current) => ({ ...current, bannerUrl: e.target.value }))} placeholder="Banner image URL" className="w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.gradientFrom} onChange={(e) => setForm((current) => ({ ...current, gradientFrom: e.target.value }))} placeholder="Accent start color" className="w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
            <input value={form.gradientTo} onChange={(e) => setForm((current) => ({ ...current, gradientTo: e.target.value }))} placeholder="Accent end color" className="w-full rounded-[1.2rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>
    </WorkspaceSection>
  );
}
