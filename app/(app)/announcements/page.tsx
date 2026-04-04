// app/(app)/announcements/page.tsx
import { prisma } from "@/lib/prisma";
import { AnnouncementsClient } from "./announcements-client";
import { canAccessAdmin, canAccessFacultyTools } from "@/lib/roles";
import { getSession } from "@/lib/session";

export const metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const session = await getSession();
  if (!session?.user) return null;

  // Get posts from ALL clubs (not just joined) — school-wide feed
  const posts = await prisma.post.findMany({
    where: { club: { isActive: true } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 40,
    include: {
      club:   { select: { name: true, emoji: true, slug: true, gradientFrom: true, gradientTo: true } },
      author: { select: { name: true, image: true } },
    },
  });

  // Get user's joined clubs for "my clubs" filter
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { clubId: true },
  });
  const joinedClubIds = new Set(memberships.map((m) => m.clubId));

  return (
    <AnnouncementsClient
      posts={posts as any}
      joinedClubIds={Array.from(joinedClubIds)}
      userId={session.user.id}
      isAdmin={canAccessAdmin(session.user.role)}
      canModerate={canAccessFacultyTools(session.user.role)}
    />
  );
}
