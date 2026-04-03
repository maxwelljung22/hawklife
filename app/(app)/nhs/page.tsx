// app/(app)/nhs/page.tsx
import { auth } from "@/auth";
import { getAllNhsRecords, getNhsRecordForUser } from "@/lib/airtable";
import { canAccessFacultyTools } from "@/lib/roles";
import { NhsClient } from "./nhs-client";

export const metadata = { title: "NHS Hours" };
export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min server-side cache

export default async function NhsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = canAccessFacultyTools(session.user.role);

  const [myRecord, allRecords] = await Promise.all([
    getNhsRecordForUser(session.user.email!, session.user.name),
    isAdmin ? getAllNhsRecords() : Promise.resolve(null),
  ]);

  return (
    <NhsClient
      myRecord={myRecord}
      allRecords={allRecords}
      isAdmin={isAdmin}
      userEmail={session.user.email!}
    />
  );
}
