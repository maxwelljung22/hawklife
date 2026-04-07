// app/(app)/admin/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma, type MembershipRole, type UserRole } from "@prisma/client";
import { canAccessAdmin, canAccessFacultyTools } from "@/lib/roles";
import { normalizePlainText, normalizeSlug } from "@/lib/sanitize";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) throw new Error("Unauthorized");
  return session;
}

async function checkOversight() {
  const session = await auth();
  if (!session?.user || !canAccessFacultyTools(session.user.role)) throw new Error("Unauthorized");
  return session;
}

export async function updateApplicationStatus(applicationId: string, status: "ACCEPTED" | "REJECTED" | "WAITLISTED" | "UNDER_REVIEW") {
  try {
    await checkAdmin();
    await prisma.application.update({
      where: { id: applicationId },
      data: { status, reviewedAt: new Date() },
    });
    revalidatePath("/admin");
    revalidatePath("/applications");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createChangelogEntry(data: {
  title: string;
  content: string;
  type: string;
  isFeatured: boolean;
}) {
  try {
    await checkOversight();
    const title = normalizePlainText(data.title, { maxLength: 120 });
    const content = normalizePlainText(data.content, { maxLength: 5000 });
    if (!title || !content) return { error: "Add a title and content first." };

    const entry = await prisma.changelogEntry.create({
      data: {
        title,
        content,
        type: data.type as any,
        isFeatured: data.isFeatured,
        isPublished: true,
      },
    });
    revalidatePath("/changelog");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { entry };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateChangelogEntry(entryId: string, data: {
  title: string;
  content: string;
  type: string;
  isFeatured: boolean;
}) {
  try {
    await checkOversight();
    const title = normalizePlainText(data.title, { maxLength: 120 });
    const content = normalizePlainText(data.content, { maxLength: 5000 });
    if (!title || !content) return { error: "Add a title and content first." };

    const entry = await prisma.changelogEntry.update({
      where: { id: entryId },
      data: {
        title,
        content,
        type: data.type as any,
        isFeatured: data.isFeatured,
      },
    });
    revalidatePath("/changelog");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { entry };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteChangelogEntry(entryId: string) {
  try {
    await checkOversight();
    await prisma.changelogEntry.delete({ where: { id: entryId } });
    revalidatePath("/changelog");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteClubAdmin(clubId: string) {
  try {
    await checkAdmin();
    await prisma.club.update({ where: { id: clubId }, data: { isActive: false } });
    revalidatePath("/clubs");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function setClubFlag(clubId: string, flagged: boolean, flagReason?: string) {
  try {
    await checkOversight();
    await prisma.club.update({
      where: { id: clubId },
      data: {
        isFlagged: flagged,
        flagReason: flagged ? flagReason?.trim() || "Flagged for faculty review." : null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/clubs");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  try {
    await checkAdmin();
    await prisma.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function assignClubLeadership(userId: string, clubId: string, role: MembershipRole) {
  try {
    await checkAdmin();
    await prisma.membership.upsert({
      where: { userId_clubId: { userId, clubId } },
      update: { role, status: "ACTIVE" },
      create: { userId, clubId, role, status: "ACTIVE" },
    });
    revalidatePath("/admin");
    revalidatePath("/clubs");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function removeClubLeadership(userId: string, clubId: string) {
  try {
    await checkAdmin();
    await prisma.membership.updateMany({
      where: {
        userId,
        clubId,
        status: "ACTIVE",
        role: { in: ["OFFICER", "PRESIDENT", "FACULTY_ADVISOR"] },
      },
      data: { role: "MEMBER" },
    });
    revalidatePath("/admin");
    revalidatePath("/clubs");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function approveClubEditRequest(clubId: string) {
  try {
    await checkAdmin();
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        slug: true,
        pendingEditRequest: true,
      },
    });
    if (!club?.pendingEditRequest || typeof club.pendingEditRequest !== "object") {
      return { error: "No pending club edit request was found." };
    }

    const request = club.pendingEditRequest as Record<string, unknown>;
    const nextSlug = normalizeSlug(String(request.slug ?? ""));
    if (!nextSlug) return { error: "The pending request is missing a valid slug." };

    const conflict = await prisma.club.findFirst({
      where: {
        slug: nextSlug,
        NOT: { id: clubId },
      },
      select: { id: true },
    });
    if (conflict) return { error: "That requested club URL is already in use." };

    await prisma.club.update({
      where: { id: clubId },
      data: {
        name: String(request.name ?? ""),
        slug: nextSlug,
        tagline: String(request.tagline ?? "") || null,
        description: String(request.description ?? ""),
        meetingDay: String(request.meetingDay ?? "") || null,
        meetingTime: String(request.meetingTime ?? "") || null,
        meetingRoom: String(request.meetingRoom ?? "") || null,
        logoUrl: String(request.logoUrl ?? "") || null,
        bannerUrl: String(request.bannerUrl ?? "") || null,
        gradientFrom: String(request.gradientFrom ?? "") || undefined,
        gradientTo: String(request.gradientTo ?? "") || undefined,
        pendingEditRequest: Prisma.JsonNull,
        pendingEditSubmittedAt: null,
        pendingEditSubmittedById: null,
        pendingEditStatus: "APPROVED",
      },
    });

    revalidatePath("/clubs");
    revalidatePath(`/clubs/${club.slug}`);
    revalidatePath(`/clubs/${nextSlug}`);
    revalidatePath("/admin");
    return { success: true, slug: nextSlug };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function denyClubEditRequest(clubId: string) {
  try {
    await checkAdmin();
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { slug: true },
    });
    await prisma.club.update({
      where: { id: clubId },
      data: {
        pendingEditRequest: Prisma.JsonNull,
        pendingEditSubmittedAt: null,
        pendingEditSubmittedById: null,
        pendingEditStatus: "DENIED",
      },
    });
    revalidatePath("/clubs");
    if (club?.slug) revalidatePath(`/clubs/${club.slug}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
