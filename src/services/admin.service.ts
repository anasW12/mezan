import { prisma } from "@/lib/prisma";
import { BusinessRuleError } from "@/lib/action-utils";

export async function getAllCompaniesForAdmin() {
  return prisma.company.findMany({
    include: {
      users: {
        where: { role: "OWNER" },
        take: 1,
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCompanyPlanStatusForAdmin(
  companyId: string,
  planStatus: "ACTIVE" | "EXPIRED"
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });

  if (!company) {
    throw new BusinessRuleError("الشركة غير موجودة");
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { planStatus },
  });
}
