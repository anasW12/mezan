import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BusinessRuleError } from "@/lib/action-utils";
import { writeAuditLog } from "@/services/audit.service";
import type {
  ProductCreateInput,
  ProductUpdateInput,
} from "@/lib/validations/inventory";

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

export async function createProductForCompany(
  companyId: string,
  input: ProductCreateInput
) {
  return prisma.$transaction(async (tx) => {
    const avgCost = new Prisma.Decimal(input.averageCostPrice);
    const sellingPrice = new Prisma.Decimal(input.sellingPrice);

    const product = await tx.product.create({
      data: {
        companyId,
        name: input.name,
        stockQuantity: input.stockQuantity,
        averageCostPrice: avgCost,
        sellingPrice,
      },
    });

    const initialValuation = avgCost.mul(input.stockQuantity);

    await writeAuditLog(tx, {
      companyId,
      actionType: "PRODUCT_ADDED",
      summary: `إضافة منتج جديد: ${product.name} (الكمية: ${product.stockQuantity})`,
      amount: initialValuation,
    });

    return product;
  });
}

export async function updateProductForCompany(
  companyId: string,
  input: ProductUpdateInput
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findFirst({
      where: { id: input.id, companyId },
    });

    if (!existing) {
      throw new BusinessRuleError("المنتج غير موجود أو لا ينتمي لهذه الشركة");
    }

    const updated = await tx.product.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        stockQuantity: input.stockQuantity,
        averageCostPrice: new Prisma.Decimal(input.averageCostPrice),
        sellingPrice: new Prisma.Decimal(input.sellingPrice),
      },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "PRODUCT_UPDATED",
      summary: `تعديل بيانات المنتج: ${updated.name} (الكمية: ${updated.stockQuantity})`,
      amount: 0,
    });

    return updated;
  });
}

export async function deleteProductForCompany(
  companyId: string,
  productId: string
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findFirst({
      where: { id: productId, companyId },
      include: {
        _count: {
          select: {
            purchaseItems: true,
            salesItems: true,
          },
        },
      },
    });

    if (!existing) {
      throw new BusinessRuleError("المنتج غير موجود أو لا ينتمي لهذه الشركة");
    }

    if (existing._count.purchaseItems > 0 || existing._count.salesItems > 0) {
      throw new BusinessRuleError(
        "لا يمكن حذف هذا المنتج لارتباطه بفواتير بيع أو شراء مسجلة"
      );
    }

    await tx.product.delete({
      where: { id: existing.id },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "PRODUCT_UPDATED",
      summary: `حذف المنتج من المخزن: ${existing.name}`,
      amount: 0,
    });
  });
}
