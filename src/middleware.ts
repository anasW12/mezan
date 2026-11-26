import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = new Set(["/", "/login", "/register"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  if (pathname === "/onboarding") {
    const target = user
      ? user.role === "PLATFORM_ADMIN"
        ? "/admin"
        : "/dashboard"
      : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }

  if (PUBLIC_ROUTES.has(pathname)) {
    if (user && (pathname === "/login" || pathname === "/register")) {
      const target = user.role === "PLATFORM_ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (user.role === "PLATFORM_ADMIN") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!user.companyId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (user.planStatus === "EXPIRED" && pathname !== "/expired") {
    return NextResponse.redirect(new URL("/expired", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
