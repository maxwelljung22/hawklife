// app/(app)/admin/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { canAccessAdmin } from "@/lib/roles";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) throw new Error("Unauthorized");
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
    await checkAdmin();
    const entry = await prisma.changelogEntry.create({
      data: {
        title: data.title,
        content: data.content,
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
