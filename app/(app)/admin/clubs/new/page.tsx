// app/(app)/admin/clubs/new/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NewClubClient } from "./new-club-client";
import { canAccessAdmin } from "@/lib/roles";

export const metadata = { title: "Create Club — Admin" };

export default async function NewClubPage() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) redirect("/dashboard");
  return (
    <NewClubClient
      mode="create"
      initialValues={{
        name: "",
        slug: "",
        logoUrl: "",
        emoji: "🏛️",
        tagline: "",
        description: "",
        category: "OTHER",
        commitment: "MEDIUM",
        meetingDay: "",
        meetingTime: "",
        meetingRoom: "",
        requiresApp: false,
        tags: [],
        gradientFrom: "#1a3a6e",
        gradientTo: "#0c2a52",
      }}
    />
  );
}
