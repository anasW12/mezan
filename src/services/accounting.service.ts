import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
  });
}

export async function createPurchaseForCompany(
  companyId: string,
  input: PurchaseInput
) {
  return prisma.$transaction(async (tx) => {
    const safe = await tx.safe.findFirst({
      where: { id: input.safeId, companyId },
    });

    if (!safe) {
      throw new BusinessRuleError("الخزينة المختارة غير موجودة");
    }

    const totalAmount = input.items.reduce(
      (sum, item) =>
        sum.plus(new Prisma.Decimal(item.unitCost).mul(item.quantity)),
      new Prisma.Decimal(0)
    );

    if (safe.balance.lt(totalAmount)) {
      throw new InsufficientBalanceError(
        `الرصيد المتاح في "${safe.name}" غير كافٍ لإتمام فاتورة الشراء`
      );
    }

    const uniqueProductIds = Array.from(
      new Set(input.items.map((item) => item.productId))
    );
    const dbProducts = await tx.product.findMany({
      where: {
        id: { in: uniqueProductIds },
        companyId,
      },
    });

    if (dbProducts.length !== uniqueProductIds.length) {
      throw new BusinessRuleError("أحد المنتجات المختارة غير موجود في المخزن");
    }

    const productState = new Map(
      dbProducts.map((p) => [
        p.id,
        {
          name: p.name,
          stockQuantity: p.stockQuantity,
          averageCostPrice: p.averageCostPrice,
        },
      ])
    );

    const summaryEntries: Array<{ name: string; quantity: number }> = [];

    for (const item of input.items) {
      const current = productState.get(item.productId)!;
      const newUnitCost = new Prisma.Decimal(item.unitCost);
      const nextAvgCost = calculateWeightedAverageCost(
        current.stockQuantity,
        current.averageCostPrice,
        item.quantity,
        newUnitCost
      );
      const nextQty = current.stockQuantity + item.quantity;

      productState.set(item.productId, {
        name: current.name,
        stockQuantity: nextQty,
        averageCostPrice: nextAvgCost,
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: nextQty,
          averageCostPrice: nextAvgCost,
        },
      });

      summaryEntries.push({ name: current.name, quantity: item.quantity });
    }

    await tx.safe.update({
      where: { id: safe.id },
      data: {
        balance: { decrement: totalAmount },
      },
    });

    const invoice = await tx.purchaseInvoice.create({
      data: {
        companyId,
        safeId: safe.id,
        supplierName: input.supplierName || null,
        totalAmount,
        notes: input.notes || null,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(item.unitCost),
          })),
        },
      },
    });

    const supplierLabel = input.supplierName
      ? ` من ${input.supplierName}`
      : "";

    await writeAuditLog(tx, {
      companyId,
      actionType: "PURCHASE_CREATED",
      summary: `فاتورة شراء${supplierLabel}: ${summarizeItems(summaryEntries)}`,
      amount: totalAmount.neg(),
    });

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
  });
}

export async function createSaleForCompany(
  companyId: string,
  input: SaleInput
) {
  return prisma.$transaction(async (tx) => {
    let targetSafeId: string | null = null;
    if (input.paymentStatus === "PAID") {
      const safe = await tx.safe.findFirst({
        where: { id: input.safeId, companyId },
      });
      if (!safe) {
        throw new BusinessRuleError("الخزينة المستلمة غير موجودة");
      }
      targetSafeId = safe.id;
    }

    const uniqueProductIds = Array.from(
      new Set(input.items.map((item) => item.productId))
    );
    const dbProducts = await tx.product.findMany({
      where: {
        id: { in: uniqueProductIds },
        companyId,
      },
    });

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

      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: { decrement: totalRequested },
        },
      });
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

    const invoice = await tx.salesInvoice.create({
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
    });

    if (input.paymentStatus === "PAID" && targetSafeId) {
      await tx.safe.update({
        where: { id: targetSafeId },
        data: {
          balance: { increment: totalRevenue },
        },
      });
    }

    const paymentLabel =
      input.paymentStatus === "PAID" ? "مدفوع نقداً" : "تحت التحصيل COD";

    await writeAuditLog(tx, {
      companyId,
      actionType: "SALE_CREATED",
      summary: `فاتورة بيع (${paymentLabel}): ${summarizeItems(summaryEntries)}`,
      amount: totalRevenue,
    });

    return invoice;
  });
}

export async function settleSaleForCompany(
  companyId: string,
  input: SettleSaleInput
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.salesInvoice.findFirst({
      where: { id: input.invoiceId, companyId },
    });

    if (!invoice) {
      throw new BusinessRuleError("فاتورة البيع غير موجودة");
    }

    if (invoice.paymentStatus === "PAID") {
      throw new BusinessRuleError("تم تحصيل هذه الفاتورة مسبقاً");
    }

    const safe = input.safeId
      ? await tx.safe.findFirst({
          where: { id: input.safeId, companyId },
        })
      : await tx.safe.findFirst({
          where: { companyId },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

    if (!safe) {
      throw new BusinessRuleError("لا توجد خزينة متاحة لإيداع التحصيل");
    }

    const updated = await tx.salesInvoice.update({
      where: { id: invoice.id },
      data: {
        paymentStatus: "PAID",
        safeId: safe.id,
        collectedAt: new Date(),
      },
    });

    await tx.safe.update({
      where: { id: safe.id },
      data: {
        balance: { increment: invoice.totalRevenue },
      },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "SALE_COLLECTED",
      summary: `تحصيل فاتورة مبيعات #${invoice.id.slice(-6).toUpperCase()} إلى ${safe.name}`,
      amount: invoice.totalRevenue,
    });

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
  });
}

export async function createExpenseForCompany(
  companyId: string,
  input: ExpenseInput
) {
  return prisma.$transaction(async (tx) => {
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

    await tx.safe.update({
      where: { id: safe.id },
      data: {
        balance: { decrement: amount },
      },
    });

    const expense = await tx.generalExpense.create({
      data: {
        companyId,
        safeId: safe.id,
        category: input.category,
        description: input.description,
        amount,
      },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "EXPENSE_CREATED",
      summary: `مصروف عام (${input.category}): ${input.description} — من ${safe.name}`,
      amount: amount.neg(),
    });

    return expense;
  });
}

export async function deleteExpenseForCompany(
  companyId: string,
  expenseId: string
) {
  return prisma.$transaction(async (tx) => {
    const expense = await tx.generalExpense.findFirst({
      where: { id: expenseId, companyId },
      include: { safe: { select: { name: true } } },
    });

    if (!expense) {
      throw new BusinessRuleError("المصروف غير موجود");
    }

    await tx.generalExpense.delete({
      where: { id: expense.id },
    });

    await tx.safe.update({
      where: { id: expense.safeId },
      data: {
        balance: { increment: expense.amount },
      },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "SAFE_ADJUSTED",
      summary: `إلغاء مصروف عام وإعادة المبلغ إلى ${expense.safe.name}: ${expense.description ?? expense.category}`,
      amount: expense.amount,
    });
  });
}

export async function getWithdrawalsByCompany(companyId: string) {
  return prisma.ownerWithdrawal.findMany({
    where: { companyId },
    include: {
      safe: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWithdrawalForCompany(
  companyId: string,
  input: WithdrawalInput
) {
  return prisma.$transaction(async (tx) => {
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

    await tx.safe.update({
      where: { id: safe.id },
      data: {
        balance: { decrement: amount },
      },
    });

    const withdrawal = await tx.ownerWithdrawal.create({
      data: {
        companyId,
        safeId: safe.id,
        notes: input.notes,
        amount,
      },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "WITHDRAWAL_CREATED",
      summary: `مسحوبات شخصية: ${input.notes} — من ${safe.name}`,
      amount: amount.neg(),
    });

    return withdrawal;
  });
}

export async function deleteWithdrawalForCompany(
  companyId: string,
  withdrawalId: string
) {
  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.ownerWithdrawal.findFirst({
      where: { id: withdrawalId, companyId },
      include: { safe: { select: { name: true } } },
    });

    if (!withdrawal) {
      throw new BusinessRuleError("سجل المسحوبات غير موجود");
    }

    await tx.ownerWithdrawal.delete({
      where: { id: withdrawal.id },
    });

    await tx.safe.update({
      where: { id: withdrawal.safeId },
      data: {
        balance: { increment: withdrawal.amount },
      },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "SAFE_ADJUSTED",
      summary: `إلغاء مسحوبات شخصية وإعادة المبلغ إلى ${withdrawal.safe.name}: ${withdrawal.notes ?? ""}`.trim(),
      amount: withdrawal.amount,
    });
  });
}
