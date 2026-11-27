import { Prisma } from "@prisma/client";
import { prisma, runTransaction } from "@/lib/prisma";
import { BusinessRuleError } from "@/lib/action-utils";
import { writeAuditLog } from "@/services/audit.service";
import type { ProductUpdateInput } from "@/lib/validations/inventory";

/**
 * Weighted Average Cost Price formula:
 * New Avg Cost = ((Old Qty * Old Avg Cost) + (New Qty * New Unit Cost)) / (Old Qty + New Qty)
 */
export function calculateWeightedAverageCost(
  oldQty: number,
  oldAvgCost: Prisma.Decimal,
  newQty: number,
  newUnitCost: Prisma.Decimal
): Prisma.Decimal {
  const totalQty = oldQty + newQty;
  if (totalQty <= 0) {
    return newUnitCost;
  }

  const oldTotalValue = oldAvgCost.mul(oldQty);
  const newTotalValue = newUnitCost.mul(newQty);
  return oldTotalValue.plus(newTotalValue).div(totalQty);
}

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
