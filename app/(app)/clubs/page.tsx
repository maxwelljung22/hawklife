// app/(app)/clubs/page.tsx
import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ClubsClient } from "./clubs-client";
import { ClubsSkeleton } from "./clubs-skeleton";
import type { ClubCategory, CommitmentLevel } from "@prisma/client";

export const metadata = { title: "Club Directory" };
export const dynamic = "force-dynamic";

interface SearchParams {
  category?: string;
  commitment?: string;
  q?: string;
}

async function getClubs(userId: string, params: SearchParams) {
  const where: any = { isActive: true };
  if (params.category && params.category !== "all") where.category = params.category.toUpperCase() as ClubCategory;
  if (params.commitment && params.commitment !== "any") where.commitment = params.commitment.toUpperCase() as CommitmentLevel;
  if (params.q) {
    where.OR = [
      { name:        { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { tagline:     { contains: params.q, mode: "insensitive" } },
      { tags:        { has: params.q.toLowerCase() } },
    ];
  }

  const [clubs, memberships] = await Promise.all([
    prisma.club.findMany({
      where,
      orderBy: [{ memberships: { _count: "desc" } }, { name: "asc" }],
      include: {
        _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.membership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { clubId: true },
    }),
  ]);

  const joinedIds = new Set(memberships.map((m) => m.clubId));
  return clubs.map((c) => ({ ...c, joined: joinedIds.has(c.id) }));
}

export default async function ClubsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const resolvedSearchParams = (await searchParams) ?? {};
  const clubs = await getClubs(session.user.id, resolvedSearchParams);

  return (
    <Suspense fallback={<ClubsSkeleton />}>
      <ClubsClient clubs={clubs} userId={session.user.id} role={session.user.role} />
    </Suspense>
  );
}
