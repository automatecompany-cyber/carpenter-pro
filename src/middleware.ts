import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value;
  const path = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicPaths = ["/login", "/api/auth/login"];
  if (publicPaths.some((p) => path.startsWith(p))) {
    // If already logged in, redirect from login to dashboard
    if (sessionId && path === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - redirect to login if no session
  if (!sessionId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
