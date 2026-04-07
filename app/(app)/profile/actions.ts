// app/(app)/profile/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getGradeForGraduationYear(graduationYear: number) {
  const now = new Date();
  const academicYearEnd = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const grade = 12 - (graduationYear - academicYearEnd);
  return Math.max(9, Math.min(12, grade));
}

export async function updateProfile(data: { bio?: string; grade?: number }) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bio:   data.bio?.trim() || null,
        grade: data.grade ?? null,
      },
    });
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: "Failed to update profile" };
  }
}

export async function completeAccountSetup(graduationYear: number) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  if (![2026, 2027, 2028, 2029].includes(graduationYear)) {
    return { error: "Choose a valid class year." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        graduationYear,
        grade: getGradeForGraduationYear(graduationYear),
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { error: "Failed to finish account setup." };
  }
}
