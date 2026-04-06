"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canAccessAdmin, canManageClubMembershipRole } from "@/lib/roles";
import type { ResourceCategory, ResourceType, WorkspaceTaskStatus } from "@prisma/client";
import {
  normalizeHttpsUrl,
  normalizeMultilineText,
  normalizeSingleLineText,
  normalizeThemeColor,
} from "@/lib/sanitize";

async function requireWorkspaceUser() {
  const session = await auth();
  return session?.user ?? null;
}

async function getClubMembership(clubId: string, userId: string) {
  return prisma.membership.findUnique({
    where: { userId_clubId: { userId, clubId } },
    select: { role: true, status: true },
  });
}

async function ensureWorkspaceAccess(clubId: string, userId: string, role?: string | null) {
  if (canAccessAdmin(role as any)) return { canView: true, canManage: true };

  const membership = await getClubMembership(clubId, userId);
  const canView = Boolean(membership && membership.status === "ACTIVE");
  const canManage = Boolean(canView && canManageClubMembershipRole(membership?.role));
  return { canView, canManage };
}

function normalizeAttachments(attachments: string[]) {
  const items = attachments
    .map((item) => normalizeHttpsUrl(item))
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ url, label: url.replace(/^https:\/\//, "") }));

  return items.length > 0 ? items : undefined;
}

function workspacePaths(clubId: string) {
  return [`/clubs/${clubId}`, `/clubs/${clubId}/workspace`, "/clubs"];
}

function revalidateWorkspace(clubId: string) {
  for (const path of workspacePaths(clubId)) {
    revalidatePath(path);
  }
}

export async function createWorkspacePost(clubId: string, input: { content: string; attachments: string[] }) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const access = await ensureWorkspaceAccess(clubId, user.id, user.role);
  if (!access.canManage) return { error: "Only club leaders can post to the stream." };

  const content = normalizeMultilineText(input.content);
  if (!content) return { error: "Add post content first." };

  try {
    const post = await prisma.workspacePost.create({
      data: {
        clubId,
        authorId: user.id,
        content,
        attachments: normalizeAttachments(input.attachments),
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        comments: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
        reactions: { select: { id: true, userId: true } },
      },
    });

    revalidateWorkspace(clubId);
    return { post };
  } catch (error) {
    console.error("[createWorkspacePost]", error);
    return { error: "Failed to create post." };
  }
}

export async function createWorkspaceComment(postId: string, content: string) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const post = await prisma.workspacePost.findUnique({
    where: { id: postId },
    select: { id: true, clubId: true },
  });
  if (!post) return { error: "Post not found." };

  const access = await ensureWorkspaceAccess(post.clubId, user.id, user.role);
  if (!access.canView) return { error: "Only members can comment." };

  const normalized = normalizeMultilineText(content);
  if (!normalized) return { error: "Add a comment first." };

  try {
    await prisma.workspaceComment.create({
      data: {
        postId,
        authorId: user.id,
        content: normalized,
      },
    });
    revalidateWorkspace(post.clubId);
    return { success: true };
  } catch (error) {
    console.error("[createWorkspaceComment]", error);
    return { error: "Failed to add comment." };
  }
}

export async function toggleWorkspaceReaction(postId: string) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const post = await prisma.workspacePost.findUnique({
    where: { id: postId },
    select: { id: true, clubId: true },
  });
  if (!post) return { error: "Post not found." };

  const access = await ensureWorkspaceAccess(post.clubId, user.id, user.role);
  if (!access.canView) return { error: "Only members can react." };

  try {
    const existing = await prisma.workspaceReaction.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
      select: { id: true },
    });

    if (existing) {
      await prisma.workspaceReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.workspaceReaction.create({ data: { postId, userId: user.id } });
    }

    revalidateWorkspace(post.clubId);
    return { success: true };
  } catch (error) {
    console.error("[toggleWorkspaceReaction]", error);
    return { error: "Failed to update reaction." };
  }
}

export async function createWorkspaceAssignment(
  clubId: string,
  input: { title: string; description: string; dueAt?: string | null; attachments: string[] }
) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const access = await ensureWorkspaceAccess(clubId, user.id, user.role);
  if (!access.canManage) return { error: "Only club leaders can create assignments." };

  const title = normalizeSingleLineText(input.title, { maxLength: 120 });
  const description = normalizeMultilineText(input.description, { maxLength: 4000 });
  if (!title || !description) return { error: "Add a title and description." };

  try {
    const assignment = await prisma.workspaceAssignment.create({
      data: {
        clubId,
        createdById: user.id,
        title,
        description,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        attachments: normalizeAttachments(input.attachments),
      },
    });

    revalidateWorkspace(clubId);
    return { assignment };
  } catch (error) {
    console.error("[createWorkspaceAssignment]", error);
    return { error: "Failed to create assignment." };
  }
}

export async function submitWorkspaceAssignment(
  assignmentId: string,
  input: { content: string; attachments: string[]; markComplete?: boolean }
) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const assignment = await prisma.workspaceAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, clubId: true },
  });
  if (!assignment) return { error: "Assignment not found." };

  const access = await ensureWorkspaceAccess(assignment.clubId, user.id, user.role);
  if (!access.canView) return { error: "Only members can submit work." };

  try {
    await prisma.workspaceAssignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId: user.id } },
      update: {
        content: normalizeMultilineText(input.content) || null,
        attachments: normalizeAttachments(input.attachments),
        submittedAt: new Date(),
        completedAt: input.markComplete ? new Date() : null,
      },
      create: {
        assignmentId,
        userId: user.id,
        content: normalizeMultilineText(input.content) || null,
        attachments: normalizeAttachments(input.attachments),
        submittedAt: new Date(),
        completedAt: input.markComplete ? new Date() : null,
      },
    });

    revalidateWorkspace(assignment.clubId);
    return { success: true };
  } catch (error) {
    console.error("[submitWorkspaceAssignment]", error);
    return { error: "Failed to submit assignment." };
  }
}

export async function markAssignmentComplete(assignmentId: string) {
  return submitWorkspaceAssignment(assignmentId, { content: "", attachments: [], markComplete: true });
}

export async function createWorkspaceTask(
  clubId: string,
  input: { title: string; description?: string; assigneeId?: string | null; dueAt?: string | null }
) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const access = await ensureWorkspaceAccess(clubId, user.id, user.role);
  if (!access.canManage) return { error: "Only club leaders can create tasks." };

  const title = normalizeSingleLineText(input.title, { maxLength: 120 });
  if (!title) return { error: "Add a task title." };

  let assigneeId: string | null = null;
  if (input.assigneeId) {
    const assigneeMembership = await prisma.membership.findUnique({
      where: { userId_clubId: { userId: input.assigneeId, clubId } },
      select: { status: true },
    });
    if (!assigneeMembership || assigneeMembership.status !== "ACTIVE") {
      return { error: "Assign tasks only to active club members." };
    }
    assigneeId = input.assigneeId;
  }

  try {
    const task = await prisma.workspaceTask.create({
      data: {
        clubId,
        createdById: user.id,
        assigneeId,
        title,
        description: normalizeMultilineText(input.description ?? "", { maxLength: 2000 }) || null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
      },
    });

    revalidateWorkspace(clubId);
    return { task };
  } catch (error) {
    console.error("[createWorkspaceTask]", error);
    return { error: "Failed to create task." };
  }
}

export async function updateWorkspaceTaskStatus(taskId: string, status: WorkspaceTaskStatus) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const task = await prisma.workspaceTask.findUnique({
    where: { id: taskId },
    select: { id: true, clubId: true, assigneeId: true },
  });
  if (!task) return { error: "Task not found." };

  const access = await ensureWorkspaceAccess(task.clubId, user.id, user.role);
  const canUpdate = access.canManage || task.assigneeId === user.id;
  if (!canUpdate) return { error: "Only the assignee or club leaders can update this task." };

  try {
    await prisma.workspaceTask.update({
      where: { id: taskId },
      data: { status },
    });
    revalidateWorkspace(task.clubId);
    return { success: true };
  } catch (error) {
    console.error("[updateWorkspaceTaskStatus]", error);
    return { error: "Failed to update task." };
  }
}

export async function createWorkspaceResource(
  clubId: string,
  input: {
    name: string;
    url: string;
    description?: string;
    type?: ResourceType;
    category?: ResourceCategory;
  }
) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const access = await ensureWorkspaceAccess(clubId, user.id, user.role);
  if (!access.canManage) return { error: "Only club leaders can add resources." };

  const resourceUrl = normalizeHttpsUrl(input.url);
  if (!resourceUrl) return { error: "Use a valid https:// URL for workspace resources." };

  try {
    const resource = await prisma.resource.create({
      data: {
        clubId,
        uploaderId: user.id,
        name: normalizeSingleLineText(input.name, { maxLength: 120 }),
        url: resourceUrl,
        description: normalizeMultilineText(input.description ?? "", { maxLength: 2000 }) || null,
        type: input.type ?? "LINK",
        category: input.category ?? "RESOURCE",
        membersOnly: true,
      },
    });

    revalidateWorkspace(clubId);
    return { resource };
  } catch (error) {
    console.error("[createWorkspaceResource]", error);
    return { error: "Failed to create resource." };
  }
}

export async function updateWorkspaceSettings(
  clubId: string,
  input: {
    bannerUrl?: string;
    gradientFrom?: string;
    gradientTo?: string;
    workspaceTitle?: string;
    workspaceDescription?: string;
  }
) {
  const user = await requireWorkspaceUser();
  if (!user) return { error: "You need to sign in first." };

  const access = await ensureWorkspaceAccess(clubId, user.id, user.role);
  if (!access.canManage) return { error: "Only club leaders can customize the workspace." };

  const bannerUrl = input.bannerUrl ? normalizeHttpsUrl(input.bannerUrl) : null;
  if (input.bannerUrl && !bannerUrl) {
    return { error: "Use a valid https:// URL for the workspace banner." };
  }

  const gradientFrom = input.gradientFrom ? normalizeThemeColor(input.gradientFrom) : null;
  if (input.gradientFrom && !gradientFrom) {
    return { error: "Use a valid hex color for the first workspace accent." };
  }

  const gradientTo = input.gradientTo ? normalizeThemeColor(input.gradientTo) : null;
  if (input.gradientTo && !gradientTo) {
    return { error: "Use a valid hex color for the second workspace accent." };
  }

  try {
    await prisma.club.update({
      where: { id: clubId },
      data: {
        bannerUrl,
        gradientFrom: gradientFrom ?? undefined,
        gradientTo: gradientTo ?? undefined,
        workspaceTitle: normalizeSingleLineText(input.workspaceTitle ?? "", { maxLength: 120 }) || null,
        workspaceDescription: normalizeMultilineText(input.workspaceDescription ?? "", { maxLength: 1000 }) || null,
      },
    });

    revalidateWorkspace(clubId);
    return { success: true };
  } catch (error) {
    console.error("[updateWorkspaceSettings]", error);
    return { error: "Failed to update workspace settings." };
  }
}
