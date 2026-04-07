import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { canAccessAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { ClubEditorClient } from "../../club-editor-client";

export const metadata = { title: "Edit Club — Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClubPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) redirect("/dashboard");

  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      emoji: true,
      tagline: true,
      description: true,
      category: true,
      commitment: true,
      meetingDay: true,
      meetingTime: true,
      meetingRoom: true,
      requiresApp: true,
      tags: true,
      gradientFrom: true,
      gradientTo: true,
    },
  });

  if (!club) notFound();

  return (
    <ClubEditorClient
      mode="edit"
      initialValues={{
        id: club.id,
        name: club.name,
        slug: club.slug,
        logoUrl: club.logoUrl ?? "",
        emoji: club.emoji,
        tagline: club.tagline ?? "",
        description: club.description,
        category: club.category,
        commitment: club.commitment,
        meetingDay: club.meetingDay ?? "",
        meetingTime: club.meetingTime ?? "",
        meetingRoom: club.meetingRoom ?? "",
        requiresApp: club.requiresApp,
        tags: club.tags,
        gradientFrom: club.gradientFrom,
        gradientTo: club.gradientTo,
      }}
    />
  );
}
