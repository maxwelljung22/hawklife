// app/(app)/nhs/actions.ts
"use server";

import { auth } from "@/auth";
import { syncNhsNow } from "@/lib/airtable";
import { revalidatePath } from "next/cache";
import { canAccessAdmin } from "@/lib/roles";

export async function syncNhs() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const result = await syncNhsNow();
  revalidatePath("/nhs");
  revalidatePath("/dashboard");
  return result;
}
