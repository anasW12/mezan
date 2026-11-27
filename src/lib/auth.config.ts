import type { NextAuthConfig } from "next-auth";
import type { PlanStatus, Role } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.planStatus = user.planStatus;
        token.trialEndsAt = user.trialEndsAt;
      }

      if (trigger === "update" && session && typeof session === "object") {
        const updatedUser = (session as { user?: Partial<{ planStatus: PlanStatus | null; trialEndsAt: string | null }> }).user;
        if (updatedUser) {
          if (updatedUser.planStatus !== undefined) {
            token.planStatus = updatedUser.planStatus;
          }
          if (updatedUser.trialEndsAt !== undefined) {
            token.trialEndsAt = updatedUser.trialEndsAt;
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.companyId = (token.companyId as string | null) ?? null;
        session.user.planStatus = (token.planStatus as PlanStatus | null) ?? null;
        session.user.trialEndsAt = (token.trialEndsAt as string | null) ?? null;
      }
      return session;
    },
  },
  providers: [],
};
