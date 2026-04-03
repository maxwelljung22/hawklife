import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/clubs", "/calendar", "/announcements", "/voting", "/applications", "/changelog", "/nhs", "/profile", "/charter"];
const ADMIN_ONLY = ["/admin", "/api/admin"];

export default auth((req: any) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));
  const isAdmin     = ADMIN_ONLY.some((r) => pathname.startsWith(r));

  if ((isProtected || isAdmin) && !session?.user) {
    const url = new URL("/auth/signin", nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=unauthorized", nextUrl.origin));
  }

  if (pathname.startsWith("/auth/signin") && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
