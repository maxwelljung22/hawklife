// app/(app)/changelog/page.tsx
import { prisma } from "@/lib/prisma";
import { ChangelogClient } from "./changelog-client";

export const metadata = { title: "What's New" };
export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function ChangelogPage() {
  const entries = await prisma.changelogEntry.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  }).catch(() => []);

  return <ChangelogClient entries={entries} />;
}
