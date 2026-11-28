import { Prisma } from "@prisma/client";
import { prisma, runTransaction } from "@/lib/prisma";
import { calculateWeightedAverageCost } from "@/lib/accounting-math";
import { BusinessRuleError } from "@/lib/action-utils";
import { writeAuditLog } from "@/services/audit.service";
import type { ProductUpdateInput } from "@/lib/validations/inventory";

export { calculateWeightedAverageCost };

export async function getProductsByCompany(companyId: string) {
  return prisma.product.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Administrative inventory update only: allows changing product name and
 * customer selling price. Stock quantity and weighted average cost are modified
 * exclusively through purchase and sales invoices.
 */
export async function updateProductForCompany(
  companyId: string,
  input: ProductUpdateInput
) {
  return runTransaction(async (tx) => {
    const existing = await tx.product.findFirst({
      where: { id: input.id, companyId },
    });

    if (!existing) {
      throw new BusinessRuleError("المنتج غير موجود أو لا ينتمي لهذه الشركة");
    }

    const nextSellingPrice = new Prisma.Decimal(input.sellingPrice);

    const changes: string[] = [];
    if (existing.name !== input.name) {
      changes.push(`تغيير الاسم من "${existing.name}" إلى "${input.name}"`);
    }
    if (!existing.sellingPrice.eq(nextSellingPrice)) {
      changes.push(
        `تعديل سعر البيع من ${existing.sellingPrice.toFixed(2)} إلى ${nextSellingPrice.toFixed(2)} ج.م`
      );
    }

    const summary =
      changes.length > 0
        ? `تحديث إداري للمنتج (${input.name}): ${changes.join("، ")}`
        : `تأكيد البيانات الإدارية للمنتج: ${input.name}`;

    const [updated] = await Promise.all([
      tx.product.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          sellingPrice: nextSellingPrice,
        },
      }),
      writeAuditLog(tx, {
        companyId,
        actionType: "PRODUCT_UPDATED",
        summary,
        amount: 0,
      }),
    ]);

    return updated;
  });
}
