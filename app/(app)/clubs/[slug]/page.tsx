import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canManageClubMembershipRole } from "@/lib/roles";
import { ClubLandingClient } from "@/components/clubs/club-landing-client";
import { isV4Enabled } from "@/lib/feature-flags";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getClubByIdentifier(identifier: string, userId: string) {
  const select = Prisma.validator<Prisma.ClubSelect>()({
    id: true,
    slug: true,
    name: true,
    emoji: true,
    tagline: true,
    description: true,
    category: true,
    commitment: true,
    tags: true,
    requiresApp: true,
    meetingDay: true,
    meetingTime: true,
    meetingRoom: true,
    gradientFrom: true,
    gradientTo: true,
    bannerUrl: true,
    _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
    posts: {
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    },
    events: {
      where: { startTime: { gte: new Date() } },
      orderBy: { startTime: "asc" },
      take: 3,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startTime: true,
      },
    },
  });

  const club = await prisma.club.findFirst({
    where: {
      isActive: true,
      OR: [{ id: identifier }, { slug: identifier }],
    },
    select,
  });

  if (!club) return null;

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId, clubId: club.id } },
    select: { status: true, role: true },
  });

  const isLeader = canManageClubMembershipRole(membership?.role);

  const [appForm, currentApplication, applications] = await Promise.all([
    prisma.appForm.findUnique({
      where: { clubId: club.id },
      select: {
        id: true,
        fields: true,
        deadline: true,
        maxSlots: true,
        isOpen: true,
      },
    }),
    prisma.application.findUnique({
      where: {
        clubId_applicantId: {
          clubId: club.id,
          applicantId: userId,
        },
      },
      select: {
        id: true,
        status: true,
        responses: true,
        reviewNotes: true,
        createdAt: true,
      },
    }),
    isLeader
      ? prisma.application.findMany({
          where: { clubId: club.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            responses: true,
            reviewNotes: true,
            createdAt: true,
            applicant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    club,
    joined: membership?.status === "ACTIVE",
    isLeader,
    appForm,
    currentApplication,
    applications,
  };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const club = await prisma.club.findFirst({
    where: { OR: [{ id: slug }, { slug }] },
    select: { name: true, tagline: true },
  });
  return {
    title: club ? `${club.name} — Clubs` : "Club",
    description: club?.tagline ?? "Club workspace and collaboration hub",
  };
}

export default async function ClubPage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) return null;

  const { slug } = await params;
  const data = await getClubByIdentifier(slug, session.user.id);
  if (!data) notFound();

  return <ClubLandingClient {...data} v4Enabled={isV4Enabled()} />;
}
