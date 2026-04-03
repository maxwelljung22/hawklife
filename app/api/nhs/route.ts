// app/api/nhs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllNhsRecords, getNhsRecordForUser } from "@/lib/airtable";
import { canAccessAdmin, canAccessFacultyTools } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all && !canAccessFacultyTools(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (all) {
      const records = await getAllNhsRecords();
      return NextResponse.json({ records });
    } else {
      const record = await getNhsRecordForUser(session.user.email!, session.user.name);
      return NextResponse.json({ record });
    }
  } catch (err: any) {
    console.error("[NHS API]", err);
    return NextResponse.json({ error: "Failed to fetch NHS data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { syncNhsNow } = await import("@/lib/airtable");
  const result = await syncNhsNow();
  return NextResponse.json(result);
}
