import { notFound, redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin, canManageClubMembershipRole } from "@/lib/roles";
import { ClubWorkspaceClient } from "@/components/workspace/club-workspace-client";
import { AttendanceSetupNotice } from "@/components/attendance/attendance-setup-notice";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getBaseClub(identifier: string) {
  try {
    return await prisma.club.findFirst({
      where: {
        isActive: true,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        emoji: true,
        bannerUrl: true,
        gradientFrom: true,
        gradientTo: true,
        workspaceTitle: true,
        workspaceDescription: true,
      },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) throw error;

    return prisma.club.findFirst({
      where: {
        isActive: true,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        emoji: true,
        bannerUrl: true,
        gradientFrom: true,
        gradientTo: true,
      },
    }).then((club) => (club ? { ...club, workspaceTitle: null, workspaceDescription: null } : null));
  }
}

async function getWorkspaceData(identifier: string, userId: string, userRole: string) {
  const club = await getBaseClub(identifier);
  if (!club) return null;

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId, clubId: club.id } },
    select: {
      status: true,
      role: true,
    },
  });

  const joined = membership?.status === "ACTIVE" || canAccessAdmin(userRole as UserRole);
  if (!joined) return { accessDenied: true as const, clubId: club.id };

  const [members, resources, streamPosts, assignments, tasks] = await Promise.all([
    prisma.membership
      .findMany({
        where: { clubId: club.id, status: "ACTIVE" },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return [];
        throw error;
      }),
    prisma.resource
      .findMany({
        where: { clubId: club.id, membersOnly: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          url: true,
          type: true,
          category: true,
          createdAt: true,
        },
      })
      .catch(async (error) => {
        if (!isPrismaSchemaMismatchError(error)) throw error;

        return prisma.resource.findMany({
          where: { clubId: club.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            url: true,
            type: true,
            createdAt: true,
          },
        }).then((items) =>
          items.map((item) => ({
            ...item,
            category: "RESOURCE",
          }))
        );
      }),
    prisma.workspacePost
      .findMany({
        where: { clubId: club.id },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          comments: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, image: true } } },
          },
          reactions: { select: { id: true, userId: true } },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return [];
        throw error;
      }),
    prisma.workspaceAssignment
      .findMany({
        where: { clubId: club.id },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          submissions: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return [];
        throw error;
      }),
    prisma.workspaceTask
      .findMany({
        where: { clubId: club.id },
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return [];
        throw error;
      }),
  ]);

  return {
    club,
    currentUserId: userId,
    isLeader: canManageClubMembershipRole(membership?.role) || canAccessAdmin(userRole as UserRole),
    streamPosts,
    assignments,
    tasks,
    resources,
    members,
  };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const club = await prisma.club.findFirst({
    where: { OR: [{ id: slug }, { slug }] },
    select: { name: true },
  });
  return { title: club ? `${club.name} Workspace` : "Club Workspace" };
}

export default async function ClubWorkspacePage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const { slug } = await params;

  try {
    const data = await getWorkspaceData(slug, session.user.id, session.user.role);
    if (!data) notFound();
    if ("accessDenied" in data) redirect(`/clubs/${data.clubId}`);

    return <ClubWorkspaceClient {...data} />;
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <AttendanceSetupNotice
          title="Workspace needs the latest database update"
          description="This deployment includes the new club workspace, but the database is still missing the workspace tables or fields. Apply the latest Prisma changes, then refresh this page."
          eyebrow="Club Workspace"
          migrationHint="Apply the club workspace migration, then redeploy or refresh the page. The checked-in file is `prisma/migrations/20260404190000_add_club_workspace_core/migration.sql`."
        />
      );
    }

    throw error;
  }
}
