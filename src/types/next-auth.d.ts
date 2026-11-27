import type { DefaultSession } from "next-auth";
import type { PlanStatus, Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    companyId: string | null;
    planStatus: PlanStatus | null;
    trialEndsAt: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      companyId: string | null;
      planStatus: PlanStatus | null;
      trialEndsAt: string | null;
    } & DefaultSession["user"];
  }
}
