import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = new Set(["/", "/login", "/register"]);

function isSubscriptionExpired(
  planStatus: string | null | undefined,
  trialEndsAt: string | null | undefined
): boolean {
  if (planStatus === "EXPIRED") {
    return true;
  }
  if (planStatus === "TRIAL" && trialEndsAt) {
    const expiryMs = Date.parse(trialEndsAt);
    if (!Number.isNaN(expiryMs) && Date.now() > expiryMs) {
      return true;
    }
  }
  return false;
}

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
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "يرجى تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }
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

  const expired = isSubscriptionExpired(user.planStatus, user.trialEndsAt);

  if (expired) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "انتهت صلاحية اشتراك الشركة. يرجى التجديد للمتابعة.",
        },
        { status: 403 }
      );
    }
    if (pathname !== "/expired") {
      return NextResponse.redirect(new URL("/expired", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
