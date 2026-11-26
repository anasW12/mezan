import type { Session } from "next-auth";
import { UnauthorizedTenantError } from "@/lib/errors";

export function tenantWhere(session: Session | null): { companyId: string } {
  const companyId = session?.user?.companyId;
  if (!companyId) {
    throw new UnauthorizedTenantError();
  }
  return { companyId };
}
