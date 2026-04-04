"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canAccessFacultyTools } from "@/lib/roles";

export async function removeAnnouncement(postId: string) {
  const session = await auth();
  if (!session?.user || !canAccessFacultyTools(session.user.role)) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.post.delete({ where: { id: postId } });
    revalidatePath("/announcements");
    revalidatePath("/dashboard");
    revalidatePath("/clubs");
    return { success: true };
  } catch (error) {
    return { error: "Failed to remove announcement" };
  }
}
