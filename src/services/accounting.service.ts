import { Prisma } from "@prisma/client";
import { prisma, runTransaction } from "@/lib/prisma";
import { BusinessRuleError } from "@/lib/action-utils";
import {
  InsufficientBalanceError,
  InsufficientStockError,
} from "@/lib/errors";
import { writeAuditLog } from "@/services/audit.service";
import { calculateWeightedAverageCost } from "@/services/inventory.service";
import type {
  ExpenseInput,
  PurchaseInput,
  SaleInput,
  SettleSaleInput,
  WithdrawalInput,
} from "@/lib/validations/accounting";

function summarizeItems(
  entries: Array<{ name: string; quantity: number }>
): string {
  return entries.map((e) => `${e.quantity}× ${e.name}`).join("، ");
}

export async function getPurchaseInvoicesByCompany(companyId: string) {
  return prisma.purchaseInvoice.findMany({
    where: { companyId },
    include: {
      safe: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createPurchaseForCompany(
  companyId: string,
  input: PurchaseInput
) {
  return runTransaction(async (tx) => {
    const uniqueProductIds = Array.from(
      new Set(
        input.items
          .map((item) => item.productId?.trim())
          .filter((id): id is string => Boolean(id))
      )
    );

    const uniqueNewNames = Array.from(
      new Set(
        input.items
          .filter((item) => !item.productId?.trim() && item.productName?.trim())
          .map((item) => item.productName!.trim())
      )
    );

    const totalAmount = input.items.reduce(
      (sum, item) =>
        sum.plus(new Prisma.Decimal(item.unitCost).mul(item.quantity)),
      new Prisma.Decimal(0)
    );

    const [safe, dbProductsById, dbProductsByName] = await Promise.all([
      tx.safe.findFirst({
        where: { id: input.safeId, companyId },
      }),
      uniqueProductIds.length > 0
        ? tx.product.findMany({
            where: {
              id: { in: uniqueProductIds },
              companyId,
            },
          })
        : Promise.resolve([]),
      uniqueNewNames.length > 0
        ? tx.product.findMany({
            where: {
              companyId,
              OR: uniqueNewNames.map((name) => ({
                name: { equals: name, mode: "insensitive" },
              })),
            },
          })
        : Promise.resolve([]),
    ]);

    if (!safe) {
      throw new BusinessRuleError("الخزينة المختارة غير موجودة");
    }

    if (safe.balance.lt(totalAmount)) {
      throw new InsufficientBalanceError(
        `الرصيد المتاح في "${safe.name}" غير كافٍ لإتمام فاتورة الشراء`
      );
    }

    if (dbProductsById.length !== uniqueProductIds.length) {
      throw new BusinessRuleError("أحد المنتجات المختارة غير موجود في المخزن");
    }

    const productState = new Map<
      string,
      {
        name: string;
        stockQuantity: number;
        averageCostPrice: Prisma.Decimal;
      }
    >();
    const productIdByNormalizedName = new Map<string, string>();

    for (const p of [...dbProductsById, ...dbProductsByName]) {
      productState.set(p.id, {
        name: p.name,
        stockQuantity: p.stockQuantity,
        averageCostPrice: p.averageCostPrice,
      });
      productIdByNormalizedName.set(p.name.trim().toLowerCase(), p.id);
    }

    const dirtyProductIds = new Set<string>();
    const newlyCreatedProducts: Array<{
      name: string;
      sellingPrice: Prisma.Decimal;
    }> = [];
    const resolvedInvoiceItems: Array<{
      productId: string;
      quantity: number;
      unitCost: Prisma.Decimal;
    }> = [];
    const summaryEntries: Array<{ name: string; quantity: number }> = [];

    for (const item of input.items) {
      const newUnitCost = new Prisma.Decimal(item.unitCost);
      const explicitProductId = item.productId?.trim();

      let targetProductId: string | undefined = explicitProductId;
      if (!targetProductId) {
        const trimmedName = item.productName?.trim();
        if (!trimmedName) {
          throw new BusinessRuleError(
            "يرجى اختيار منتج من المخزن أو إدخال اسم الصنف الجديد"
          );
        }
        targetProductId = productIdByNormalizedName.get(
          trimmedName.toLowerCase()
        );

        if (!targetProductId) {
          const initialSellingPrice = new Prisma.Decimal(
            item.sellingPrice ?? item.unitCost
          );
          const createdProduct = await tx.product.create({
            data: {
              companyId,
              name: trimmedName,
              stockQuantity: item.quantity,
              averageCostPrice: newUnitCost,
              sellingPrice: initialSellingPrice,
            },
          });

          targetProductId = createdProduct.id;
          productIdByNormalizedName.set(
            trimmedName.toLowerCase(),
            createdProduct.id
          );
          productState.set(createdProduct.id, {
            name: createdProduct.name,
            stockQuantity: item.quantity,
            averageCostPrice: newUnitCost,
          });
          newlyCreatedProducts.push({
            name: createdProduct.name,
            sellingPrice: initialSellingPrice,
          });
          resolvedInvoiceItems.push({
            productId: createdProduct.id,
            quantity: item.quantity,
            unitCost: newUnitCost,
          });
          summaryEntries.push({
            name: `${createdProduct.name} (صنف جديد)`,
            quantity: item.quantity,
          });
          continue;
        }
      }

      const current = productState.get(targetProductId);
      if (!current) {
        throw new BusinessRuleError("أحد المنتجات المختارة غير موجود في المخزن");
      }

      const nextAvgCost = calculateWeightedAverageCost(
        current.stockQuantity,
        current.averageCostPrice,
        item.quantity,
        newUnitCost
      );
      const nextQty = current.stockQuantity + item.quantity;

      productState.set(targetProductId, {
        name: current.name,
        stockQuantity: nextQty,
        averageCostPrice: nextAvgCost,
      });
      dirtyProductIds.add(targetProductId);

      resolvedInvoiceItems.push({
        productId: targetProductId,
        quantity: item.quantity,
        unitCost: newUnitCost,
      });
      summaryEntries.push({ name: current.name, quantity: item.quantity });
    }

    const supplierLabel = input.supplierName
      ? ` من ${input.supplierName}`
      : "";

    const [invoice] = await Promise.all([
      tx.purchaseInvoice.create({
        data: {
          companyId,
          safeId: safe.id,
          supplierName: input.supplierName || null,
          totalAmount,
          notes: input.notes || null,
          items: {
            create: resolvedInvoiceItems,
          },
        },
      }),
      tx.safe.update({
        where: { id: safe.id },
        data: {
          balance: { decrement: totalAmount },
        },
      }),
      ...Array.from(dirtyProductIds).map((productId) => {
        const updatedState = productState.get(productId)!;
        return tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: updatedState.stockQuantity,
            averageCostPrice: updatedState.averageCostPrice,
          },
        });
      }),
      ...newlyCreatedProducts.map((created) =>
        writeAuditLog(tx, {
          companyId,
          actionType: "PRODUCT_ADDED",
          summary: `تعريف صنف جديد تلقائياً عبر المشتريات: ${created.name} (سعر البيع المبدئي: ${created.sellingPrice.toFixed(2)} ج.م)`,
          amount: 0,
        })
      ),
      writeAuditLog(tx, {
        companyId,
        actionType: "PURCHASE_CREATED",
        summary: `فاتورة شراء${supplierLabel}: ${summarizeItems(summaryEntries)}`,
        amount: totalAmount.neg(),
      }),
    ]);

    return invoice;
  });
}

export async function getSalesInvoicesByCompany(companyId: string) {
  return prisma.salesInvoice.findMany({
    where: { companyId },
    include: {
      safe: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createSaleForCompany(
  companyId: string,
  input: SaleInput
) {
  return runTransaction(async (tx) => {
    const uniqueProductIds = Array.from(
      new Set(input.items.map((item) => item.productId))
    );

    const [safe, dbProducts] = await Promise.all([
      input.paymentStatus === "PAID"
        ? tx.safe.findFirst({
            where: { id: input.safeId, companyId },
          })
        : Promise.resolve(null),
      tx.product.findMany({
        where: {
          id: { in: uniqueProductIds },
          companyId,
        },
      }),
    ]);

    if (input.paymentStatus === "PAID" && !safe) {
      throw new BusinessRuleError("الخزينة المستلمة غير موجودة");
    }

    if (dbProducts.length !== uniqueProductIds.length) {
      throw new BusinessRuleError("أحد المنتجات المختارة غير موجود في المخزن");
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const requestedQtyByProduct = new Map<string, number>();

    for (const item of input.items) {
      requestedQtyByProduct.set(
        item.productId,
        (requestedQtyByProduct.get(item.productId) ?? 0) + item.quantity
      );
    }

    for (const [productId, totalRequested] of requestedQtyByProduct.entries()) {
      const product = productMap.get(productId)!;
      if (product.stockQuantity < totalRequested) {
        throw new InsufficientStockError(
          `الكمية المتاحة من "${product.name}" (${product.stockQuantity}) غير كافية`
        );
      }
    }

    const totalRevenue = input.items.reduce(
      (sum, item) =>
        sum.plus(new Prisma.Decimal(item.unitPrice).mul(item.quantity)),
      new Prisma.Decimal(0)
    );
    const directCost = new Prisma.Decimal(input.directCost ?? 0);

    const summaryEntries = input.items.map((item) => ({
      name: productMap.get(item.productId)!.name,
      quantity: item.quantity,
    }));

    const paymentLabel =
      input.paymentStatus === "PAID" ? "مدفوع نقداً" : "تحت التحصيل COD";

    const targetSafeId = safe?.id ?? null;

    const [invoice] = await Promise.all([
      tx.salesInvoice.create({
        data: {
          companyId,
          safeId: targetSafeId,
          customerName: input.customerName || null,
          paymentStatus: input.paymentStatus,
          totalRevenue,
          directCost,
          notes: input.notes || null,
          collectedAt: input.paymentStatus === "PAID" ? new Date() : null,
          items: {
            create: input.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: new Prisma.Decimal(item.unitPrice),
                unitCostSnapshot: product.averageCostPrice,
              };
            }),
          },
        },
      }),
      ...Array.from(requestedQtyByProduct.entries()).map(
        ([productId, totalRequested]) =>
          tx.product.update({
            where: { id: productId },
            data: {
              stockQuantity: { decrement: totalRequested },
            },
          })
      ),
      ...(input.paymentStatus === "PAID" && targetSafeId
        ? [
            tx.safe.update({
              where: { id: targetSafeId },
              data: {
                balance: { increment: totalRevenue },
              },
            }),
          ]
        : []),
      writeAuditLog(tx, {
        companyId,
        actionType: "SALE_CREATED",
        summary: `فاتورة بيع (${paymentLabel}): ${summarizeItems(summaryEntries)}`,
        amount: totalRevenue,
      }),
    ]);

    return invoice;
  });
}

export async function settleSaleForCompany(
  companyId: string,
  input: SettleSaleInput
) {
  return runTransaction(async (tx) => {
    const [invoice, safe] = await Promise.all([
      tx.salesInvoice.findFirst({
        where: { id: input.invoiceId, companyId },
      }),
      input.safeId
        ? tx.safe.findFirst({
            where: { id: input.safeId, companyId },
          })
        : tx.safe.findFirst({
            where: { companyId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          }),
    ]);

    if (!invoice) {
      throw new BusinessRuleError("فاتورة البيع غير موجودة");
    }

    if (invoice.paymentStatus === "PAID") {
      throw new BusinessRuleError("تم تحصيل هذه الفاتورة مسبقاً");
    }

    if (!safe) {
      throw new BusinessRuleError("لا توجد خزينة متاحة لإيداع التحصيل");
    }

    const [updated] = await Promise.all([
      tx.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          paymentStatus: "PAID",
          safeId: safe.id,
          collectedAt: new Date(),
        },
      }),
      tx.safe.update({
        where: { id: safe.id },
        data: {
          balance: { increment: invoice.totalRevenue },
        },
      }),
      writeAuditLog(tx, {
        companyId,
        actionType: "SALE_COLLECTED",
        summary: `تحصيل فاتورة مبيعات #${invoice.id.slice(-6).toUpperCase()} إلى ${safe.name}`,
        amount: invoice.totalRevenue,
      }),
    ]);

    return updated;
  });
}

export async function getExpensesByCompany(companyId: string) {
  return prisma.generalExpense.findMany({
    where: { companyId },
    include: {
      safe: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createExpenseForCompany(
  companyId: string,
  input: ExpenseInput
) {
  return runTransaction(async (tx) => {
    const safe = await tx.safe.findFirst({
      where: { id: input.safeId, companyId },
    });

    if (!safe) {
      throw new BusinessRuleError("الخزينة المختارة غير موجودة");
    }

    const amount = new Prisma.Decimal(input.amount);
    if (safe.balance.lt(amount)) {
      throw new InsufficientBalanceError(
        `الرصيد المتاح في "${safe.name}" غير كافٍ لتغطية هذا المصروف`
      );
    }

    const [, expense] = await Promise.all([
      tx.safe.update({
        where: { id: safe.id },
        data: {
          balance: { decrement: amount },
        },
      }),
      tx.generalExpense.create({
        data: {
          companyId,
          safeId: safe.id,
          category: input.category,
          description: input.description,
          amount,
        },
      }),
      writeAuditLog(tx, {
        companyId,
        actionType: "EXPENSE_CREATED",
        summary: `مصروف عام (${input.category}): ${input.description} — من ${safe.name}`,
        amount: amount.neg(),
      }),
    ]);

    return expense;
  });
}

export async function deleteExpenseForCompany(
  companyId: string,
  expenseId: string
) {
  return runTransaction(async (tx) => {
    const expense = await tx.generalExpense.findFirst({
      where: { id: expenseId, companyId },
      include: { safe: { select: { name: true } } },
    });

    if (!expense) {
      throw new BusinessRuleError("المصروف غير موجود");
    }

    await Promise.all([
      tx.generalExpense.delete({
        where: { id: expense.id },
      }),
      tx.safe.update({
        where: { id: expense.safeId },
        data: {
          balance: { increment: expense.amount },
        },
      }),
      writeAuditLog(tx, {
        companyId,
        actionType: "SAFE_ADJUSTED",
        summary: `إلغاء مصروف عام وإعادة المبلغ إلى ${expense.safe.name}: ${expense.description ?? expense.category}`,
        amount: expense.amount,
      }),
    ]);
  });
}

export async function getWithdrawalsByCompany(companyId: string) {
  return prisma.ownerWithdrawal.findMany({
    where: { companyId },
    include: {
      safe: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createWithdrawalForCompany(
  companyId: string,
  input: WithdrawalInput
) {
  return runTransaction(async (tx) => {
    const safe = await tx.safe.findFirst({
      where: { id: input.safeId, companyId },
    });

    if (!safe) {
      throw new BusinessRuleError("الخزينة المختارة غير موجودة");
    }

    const amount = new Prisma.Decimal(input.amount);
    if (safe.balance.lt(amount)) {
      throw new InsufficientBalanceError(
        `الرصيد المتاح في "${safe.name}" غير كافٍ لإتمام السحب`
      );
    }

    const [, withdrawal] = await Promise.all([
      tx.safe.update({
        where: { id: safe.id },
        data: {
          balance: { decrement: amount },
        },
      }),
      tx.ownerWithdrawal.create({
        data: {
          companyId,
          safeId: safe.id,
          notes: input.notes,
          amount,
        },
      }),
      writeAuditLog(tx, {
        companyId,
        actionType: "WITHDRAWAL_CREATED",
        summary: `مسحوبات شخصية: ${input.notes} — من ${safe.name}`,
        amount: amount.neg(),
      }),
    ]);

    return withdrawal;
  });
}

export async function deleteWithdrawalForCompany(
  companyId: string,
  withdrawalId: string
) {
  return runTransaction(async (tx) => {
    const withdrawal = await tx.ownerWithdrawal.findFirst({
      where: { id: withdrawalId, companyId },
      include: { safe: { select: { name: true } } },
    });

    if (!withdrawal) {
      throw new BusinessRuleError("سجل المسحوبات غير موجود");
    }

    await Promise.all([
      tx.ownerWithdrawal.delete({
        where: { id: withdrawal.id },
      }),
      tx.safe.update({
        where: { id: withdrawal.safeId },
        data: {
          balance: { increment: withdrawal.amount },
        },
      }),
      writeAuditLog(tx, {
        companyId,
        actionType: "SAFE_ADJUSTED",
        summary: `إلغاء مسحوبات شخصية وإعادة المبلغ إلى ${withdrawal.safe.name}: ${withdrawal.notes ?? ""}`.trim(),
        amount: withdrawal.amount,
      }),
    ]);
  });
}
