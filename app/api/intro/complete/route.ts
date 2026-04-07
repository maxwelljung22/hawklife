import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rejectUntrustedOrigin, withStandardApiHeaders } from "@/lib/security";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";

export async function POST(request: Request) {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const session = await auth();

  if (!session?.user?.id) {
    return withStandardApiHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasSeenIntro: true,
        introSeenAt: new Date(),
      },
    });
  } catch (error) {
    if (!isPrismaMissingColumnError(error)) {
      throw error;
    }
  }

  return withStandardApiHeaders(NextResponse.json({ success: true }));
}
