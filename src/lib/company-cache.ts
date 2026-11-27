import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface CompanyLayoutMeta {
  id: string;
  name: string;
  planStatus: "TRIAL" | "ACTIVE" | "EXPIRED";
  trialEndsAt: string;
}

export function getCompanyMetaTag(companyId: string): string {
  return `company-meta:${companyId}`;
}

export function isCompanySubscriptionExpired(company: {
  planStatus: "TRIAL" | "ACTIVE" | "EXPIRED";
  trialEndsAt: string | Date;
}): boolean {
  if (company.planStatus === "EXPIRED") {
    return true;
  }
  if (company.planStatus === "TRIAL") {
    const trialEndsMs =
      company.trialEndsAt instanceof Date
        ? company.trialEndsAt.getTime()
        : Date.parse(company.trialEndsAt);
    if (!Number.isNaN(trialEndsMs) && Date.now() > trialEndsMs) {
      return true;
    }
  }
  return false;
}

export async function getCachedCompanyLayoutMeta(
  companyId: string
): Promise<CompanyLayoutMeta | null> {
  const cachedFetch = unstable_cache(
    async (id: string): Promise<CompanyLayoutMeta | null> => {
      const company = await prisma.company.findUnique({
        where: { id },
        select: { id: true, name: true, planStatus: true, trialEndsAt: true },
      });
      if (!company) {
        return null;
      }
      return {
        id: company.id,
        name: company.name,
        planStatus: company.planStatus,
        trialEndsAt: company.trialEndsAt.toISOString(),
      };
    },
    ["company-layout-meta", companyId],
    {
      tags: [getCompanyMetaTag(companyId)],
      revalidate: 60,
    }
  );

  return cachedFetch(companyId);
}

export function invalidateCompanyMeta(companyId: string): void {
  revalidateTag(getCompanyMetaTag(companyId));
}
