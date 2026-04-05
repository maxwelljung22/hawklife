// app/(app)/admin/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { MembershipRole, UserRole } from "@prisma/client";
import { canAccessAdmin, canAccessFacultyTools } from "@/lib/roles";
import { normalizePlainText } from "@/lib/sanitize";

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
