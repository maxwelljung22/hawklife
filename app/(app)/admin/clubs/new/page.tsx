// app/(app)/admin/clubs/new/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NewClubClient } from "./new-club-client";
import { canAccessAdmin } from "@/lib/roles";

export const metadata = { title: "Create Club — Admin" };

export default async function NewClubPage() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) redirect("/dashboard");
  return <NewClubClient />;
}
