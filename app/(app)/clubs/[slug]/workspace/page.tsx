import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin, canManageClubMembershipRole } from "@/lib/roles";
import { ClubWorkspaceClient } from "@/components/workspace/club-workspace-client";
import { AttendanceSetupNotice } from "@/components/attendance/attendance-setup-notice";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getWorkspaceData(identifier: string, userId: string, userRole: string) {
  const club = await prisma.club.findFirst({
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
      memberships: {
        where: { status: "ACTIVE" },
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
      },
      resources: {
        where: { membersOnly: true },
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
      },
      workspacePosts: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          comments: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, image: true } } },
          },
          reactions: { select: { id: true, userId: true } },
        },
      },
      workspaceAssignments: {
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          submissions: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      },
      workspaceTasks: {
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!club) return null;

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId, clubId: club.id } },
    select: { status: true, role: true },
  });

  const joined = membership?.status === "ACTIVE" || canAccessAdmin(userRole as any);
  if (!joined) return { accessDenied: true as const, clubId: club.id };

  return {
    club,
    currentUserId: userId,
    isLeader: canManageClubMembershipRole(membership?.role) || canAccessAdmin(userRole as any),
    streamPosts: club.workspacePosts,
    assignments: club.workspaceAssignments,
    tasks: club.workspaceTasks,
    resources: club.resources,
    members: club.memberships,
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
        />
      );
    }

    throw error;
  }
}
