// app/(app)/clubs/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canAccessAdmin } from "@/lib/roles";

export async function joinClub(clubId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  try {
    // Check club exists and is active
    const club = await prisma.club.findUnique({
      where: { id: clubId, isActive: true },
      select: { id: true, maxMembers: true, _count: { select: { memberships: { where: { status: "ACTIVE" } } } } },
    });
    if (!club) return { error: "Club not found" };

    // Check capacity
    if (club.maxMembers && club._count.memberships >= club.maxMembers) {
      return { error: "Club is at capacity" };
    }

    // Upsert membership
    await prisma.membership.upsert({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      update: { status: "ACTIVE" },
      create: { userId: session.user.id, clubId, status: "ACTIVE", role: "MEMBER" },
    });

    revalidatePath("/clubs");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("[joinClub]", err);
    return { error: "Failed to join club" };
  }
}

export async function leaveClub(clubId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  try {
    await prisma.membership.updateMany({
      where: { userId: session.user.id, clubId },
      data: { status: "INACTIVE" },
    });

    revalidatePath("/clubs");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("[leaveClub]", err);
    return { error: "Failed to leave club" };
  }
}

export async function createClub(data: {
  name: string; emoji: string; tagline: string; description: string;
  category: string; commitment: string; meetingDay: string; meetingTime: string;
  meetingRoom: string; requiresApp: boolean; tags: string[];
}) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) return { error: "Unauthorized" };

  const slug = data.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  try {
    const club = await prisma.club.create({
      data: {
        slug,
        name: data.name,
        emoji: data.emoji,
        tagline: data.tagline,
        description: data.description,
        category: data.category as any,
        commitment: data.commitment as any,
        meetingDay: data.meetingDay,
        meetingTime: data.meetingTime,
        meetingRoom: data.meetingRoom,
        requiresApp: data.requiresApp,
        tags: data.tags,
      },
    });

    revalidatePath("/clubs");
    revalidatePath("/admin/clubs");
    return { success: true, slug: club.slug };
  } catch (err: any) {
    if (err.code === "P2002") return { error: "A club with this name already exists" };
    console.error("[createClub]", err);
    return { error: "Failed to create club" };
  }
}

export async function updateClub(clubId: string, data: Partial<{
  name: string; emoji: string; tagline: string; description: string;
  category: string; commitment: string; meetingDay: string; meetingTime: string;
  meetingRoom: string; requiresApp: boolean; tags: string[]; isActive: boolean;
}>) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) return { error: "Unauthorized" };

  try {
    await prisma.club.update({ where: { id: clubId }, data: data as any });
    revalidatePath("/clubs");
    revalidatePath("/admin/clubs");
    return { success: true };
  } catch (err) {
    return { error: "Failed to update club" };
  }
}

export async function deleteClub(clubId: string) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) return { error: "Unauthorized" };

  try {
    // Soft delete
    await prisma.club.update({ where: { id: clubId }, data: { isActive: false } });
    revalidatePath("/clubs");
    revalidatePath("/admin/clubs");
    return { success: true };
  } catch (err) {
    return { error: "Failed to delete club" };
  }
}
