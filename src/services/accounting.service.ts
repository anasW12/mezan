import { Prisma } from "@prisma/client";
import { prisma, runTransaction } from "@/lib/prisma";
import {
  calculateSaleDecimals,
  calculateWeightedAverageCost,
  resolveInvoiceCreatedAt,
  reverseWeightedAverageCost,
} from "@/lib/accounting-math";
import { BusinessRuleError } from "@/lib/action-utils";
import {
  InsufficientBalanceError,
  InsufficientStockError,
} from "@/lib/errors";
import { writeAuditLog } from "@/services/audit.service";
import type {
  ParsedExpenseInput,
  ParsedPurchaseInput,
  ParsedSaleInput,
  ParsedUpdatePurchaseInput,
  ParsedUpdateSaleInput,
  ParsedWithdrawalInput,
  SettleSaleInput,
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

export async function getPurchaseInvoiceByIdForCompany(
  companyId: string,
  invoiceId: string
) {
  return prisma.purchaseInvoice.findFirst({
    where: { id: invoiceId, companyId },
    include: {
      safe: { select: { name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function createPurchaseForCompany(
  companyId: string,
  input: ParsedPurchaseInput
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
          createdAt: resolveInvoiceCreatedAt(input.invoiceDate),
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

export async function updatePurchaseForCompany(
  companyId: string,
  input: ParsedUpdatePurchaseInput
) {
  return runTransaction(async (tx) => {
    const oldInvoice = await tx.purchaseInvoice.findFirst({
      where: { id: input.id, companyId },
      include: {
        items: true,
      },
    });

    if (!oldInvoice) {
      throw new BusinessRuleError("فاتورة الشراء غير موجودة");
    }

    const oldQtyByProduct = new Map<string, number>();
    for (const item of oldInvoice.items) {
      oldQtyByProduct.set(
        item.productId,
        (oldQtyByProduct.get(item.productId) ?? 0) + item.quantity
      );
    }

    const uniqueNewProductIds = Array.from(
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

    const allExplicitIds = Array.from(
      new Set([...oldQtyByProduct.keys(), ...uniqueNewProductIds])
    );

    const [newSafe, dbProductsById, dbProductsByName] = await Promise.all([
      tx.safe.findFirst({
        where: { id: input.safeId, companyId },
      }),
      allExplicitIds.length > 0
        ? tx.product.findMany({
            where: {
              id: { in: allExplicitIds },
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

    if (!newSafe) {
      throw new BusinessRuleError("الخزينة المختارة غير موجودة");
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

    for (const reqId of uniqueNewProductIds) {
      if (!productState.has(reqId)) {
        throw new BusinessRuleError("أحد المنتجات المختارة غير موجود في المخزن");
      }
    }

    for (const [productId, oldQty] of oldQtyByProduct.entries()) {
      const product = productState.get(productId);
      if (!product || product.stockQuantity < oldQty) {
        throw new InsufficientStockError(
          `لا يمكن تعديل فاتورة الشراء لأن جزءاً من كمية "${product?.name ?? "المنتج"}" قد تم بيعه بالفعل (المتاح حالياً: ${product?.stockQuantity ?? 0}، كمية الفاتورة السابقة: ${oldQty})`
        );
      }
    }

    const dirtyProductIds = new Set<string>();

    // Reverse old items from stock and weighted average cost first
    for (const oldItem of oldInvoice.items) {
      const current = productState.get(oldItem.productId)!;
      const reversed = reverseWeightedAverageCost(
        current.stockQuantity,
        current.averageCostPrice,
        oldItem.quantity,
        oldItem.unitCost
      );
      productState.set(oldItem.productId, {
        name: current.name,
        stockQuantity: reversed.remainingQty,
        averageCostPrice: reversed.nextAvgCost,
      });
      dirtyProductIds.add(oldItem.productId);
    }

    const newTotalAmount = input.items.reduce(
      (sum, item) =>
        sum.plus(new Prisma.Decimal(item.unitCost).mul(item.quantity)),
      new Prisma.Decimal(0)
    );

    const sameSafe = newSafe.id === oldInvoice.safeId;
    if (sameSafe) {
      const availableAfterRefund = newSafe.balance.plus(oldInvoice.totalAmount);
      if (availableAfterRefund.lt(newTotalAmount)) {
        throw new InsufficientBalanceError(
          `الرصيد المتاح في "${newSafe.name}" غير كافٍ بعد التعديل`
        );
      }
    } else if (newSafe.balance.lt(newTotalAmount)) {
      throw new InsufficientBalanceError(
        `الرصيد المتاح في "${newSafe.name}" غير كافٍ لإتمام فاتورة الشراء`
      );
    }

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

    const netCashImpact = oldInvoice.totalAmount.minus(newTotalAmount);
    const safeOps: Promise<unknown>[] = [];

    if (sameSafe) {
      if (!netCashImpact.eq(0)) {
        safeOps.push(
          tx.safe.update({
            where: { id: newSafe.id },
            data: { balance: { increment: netCashImpact } },
          })
        );
      }
    } else {
      safeOps.push(
        tx.safe.update({
          where: { id: oldInvoice.safeId },
          data: { balance: { increment: oldInvoice.totalAmount } },
        }),
        tx.safe.update({
          where: { id: newSafe.id },
          data: { balance: { decrement: newTotalAmount } },
        })
      );
    }

    const supplierLabel = input.supplierName
      ? ` من ${input.supplierName}`
      : "";
    const invoiceCode = `#P-${oldInvoice.id.slice(-5).toUpperCase()}`;

    const [updatedInvoice] = await Promise.all([
      tx.purchaseInvoice.update({
        where: { id: oldInvoice.id },
        data: {
          safeId: newSafe.id,
          supplierName: input.supplierName || null,
          notes: input.notes || null,
          totalAmount: newTotalAmount,
          createdAt: resolveInvoiceCreatedAt(
            input.invoiceDate,
            oldInvoice.createdAt
          ),
          items: {
            deleteMany: {},
            create: resolvedInvoiceItems,
          },
        },
      }),
      ...safeOps,
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
          summary: `تعريف صنف جديد تلقائياً عبر تعديل فاتورة شراء ${invoiceCode}: ${created.name}`,
          amount: 0,
        })
      ),
      writeAuditLog(tx, {
        companyId,
        actionType: "PURCHASE_CREATED",
        summary: `تعديل فاتورة شراء ${invoiceCode}${supplierLabel}: ${summarizeItems(summaryEntries)}`,
        amount: netCashImpact,
      }),
    ]);

    return updatedInvoice;
  });
}

export async function deletePurchaseForCompany(
  companyId: string,
  invoiceId: string
) {
  return runTransaction(async (tx) => {
    const invoice = await tx.purchaseInvoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        safe: { select: { name: true } },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new BusinessRuleError("فاتورة الشراء غير موجودة");
    }

    const qtyByProduct = new Map<string, number>();
    const productState = new Map<
      string,
      {
        name: string;
        stockQuantity: number;
        averageCostPrice: Prisma.Decimal;
      }
    >();

    for (const item of invoice.items) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity
      );
      if (!productState.has(item.productId)) {
        productState.set(item.productId, {
          name: item.product.name,
          stockQuantity: item.product.stockQuantity,
          averageCostPrice: item.product.averageCostPrice,
        });
      }
    }

    for (const [productId, requiredQty] of qtyByProduct.entries()) {
      const product = productState.get(productId)!;
      if (product.stockQuantity < requiredQty) {
        throw new InsufficientStockError(
          `لا يمكن حذف فاتورة الشراء لأن جزءاً من كمية "${product.name}" تم بيعه بالفعل (المتاح حالياً: ${product.stockQuantity}، المطلوب خصمه: ${requiredQty})`
        );
      }
    }

    const summaryEntries: Array<{ name: string; quantity: number }> = [];
    for (const item of invoice.items) {
      const current = productState.get(item.productId)!;
      const reversed = reverseWeightedAverageCost(
        current.stockQuantity,
        current.averageCostPrice,
        item.quantity,
        item.unitCost
      );
      productState.set(item.productId, {
        name: current.name,
        stockQuantity: reversed.remainingQty,
        averageCostPrice: reversed.nextAvgCost,
      });
      summaryEntries.push({ name: current.name, quantity: item.quantity });
    }

    const invoiceCode = `#P-${invoice.id.slice(-5).toUpperCase()}`;

    await Promise.all([
      tx.purchaseInvoice.delete({
        where: { id: invoice.id },
      }),
      tx.safe.update({
        where: { id: invoice.safeId },
        data: { balance: { increment: invoice.totalAmount } },
      }),
      ...Array.from(productState.entries()).map(([productId, state]) =>
        tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: state.stockQuantity,
            averageCostPrice: state.averageCostPrice,
          },
        })
      ),
      writeAuditLog(tx, {
        companyId,
        actionType: "SAFE_ADJUSTED",
        summary: `حذف فاتورة شراء ${invoiceCode} وإعادة المبلغ إلى ${invoice.safe.name} وخصم الكميات: ${summarizeItems(summaryEntries)}`,
        amount: invoice.totalAmount,
      }),
    ]);
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

export async function getSaleInvoiceByIdForCompany(
  companyId: string,
  invoiceId: string
) {
  return prisma.salesInvoice.findFirst({
    where: { id: invoiceId, companyId },
    include: {
      safe: { select: { name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function createSaleForCompany(
  companyId: string,
  input: ParsedSaleInput
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

    const { subtotal, taxType, taxValue, taxAmount, totalAmount } =
      calculateSaleDecimals(input.items, input.taxType, input.taxValue);
    const directCost = new Prisma.Decimal(input.directCost ?? 0);

    const summaryEntries = input.items.map((item) => ({
      name: productMap.get(item.productId)!.name,
      quantity: item.quantity,
    }));

    const paymentLabel =
      input.paymentStatus === "PAID" ? "مدفوع نقداً" : "تحت التحصيل COD";
    const taxLabel = taxAmount.gt(0)
      ? ` (شامل ضريبة ${taxAmount.toFixed(2)} ج.م)`
      : "";

    const targetSafeId = safe?.id ?? null;

    const [invoice] = await Promise.all([
      tx.salesInvoice.create({
        data: {
          companyId,
          safeId: targetSafeId,
          customerName: input.customerName || null,
          paymentStatus: input.paymentStatus,
          subtotal,
          taxType,
          taxValue,
          taxAmount,
          totalAmount,
          totalRevenue: totalAmount,
          directCost,
          notes: input.notes || null,
          createdAt: resolveInvoiceCreatedAt(input.invoiceDate),
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
                balance: { increment: totalAmount },
              },
            }),
          ]
        : []),
      writeAuditLog(tx, {
        companyId,
        actionType: "SALE_CREATED",
        summary: `فاتورة بيع (${paymentLabel})${taxLabel}: ${summarizeItems(summaryEntries)}`,
        amount: totalAmount,
      }),
    ]);

    return invoice;
  });
}

export async function updateSaleForCompany(
  companyId: string,
  input: ParsedUpdateSaleInput
) {
  return runTransaction(async (tx) => {
    const oldInvoice = await tx.salesInvoice.findFirst({
      where: { id: input.id, companyId },
      include: {
        safe: true,
        items: true,
      },
    });

    if (!oldInvoice) {
      throw new BusinessRuleError("فاتورة البيع غير موجودة");
    }

    const oldProductIds = oldInvoice.items.map((item) => item.productId);
    const newProductIds = input.items.map((item) => item.productId);
    const allProductIds = Array.from(
      new Set([...oldProductIds, ...newProductIds])
    );

    const [newSafe, dbProducts] = await Promise.all([
      input.paymentStatus === "PAID"
        ? tx.safe.findFirst({
            where: { id: input.safeId, companyId },
          })
        : Promise.resolve(null),
      tx.product.findMany({
        where: {
          id: { in: allProductIds },
          companyId,
        },
      }),
    ]);

    if (input.paymentStatus === "PAID" && !newSafe) {
      throw new BusinessRuleError("الخزينة المستلمة غير موجودة");
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    for (const reqId of newProductIds) {
      if (!productMap.has(reqId)) {
        throw new BusinessRuleError("أحد المنتجات المختارة غير موجود في المخزن");
      }
    }

    // Restore old sold quantities in-memory first before checking new stock
    const effectiveStock = new Map<string, number>();
    for (const p of dbProducts) {
      effectiveStock.set(p.id, p.stockQuantity);
    }
    for (const oldItem of oldInvoice.items) {
      effectiveStock.set(
        oldItem.productId,
        (effectiveStock.get(oldItem.productId) ?? 0) + oldItem.quantity
      );
    }

    const newRequestedByProduct = new Map<string, number>();
    for (const item of input.items) {
      newRequestedByProduct.set(
        item.productId,
        (newRequestedByProduct.get(item.productId) ?? 0) + item.quantity
      );
    }

    for (const [productId, requestedQty] of newRequestedByProduct.entries()) {
      const availableAfterRestore = effectiveStock.get(productId) ?? 0;
      const product = productMap.get(productId)!;
      if (availableAfterRestore < requestedQty) {
        throw new InsufficientStockError(
          `الكمية المتاحة من "${product.name}" (${availableAfterRestore}) غير كافية لإتمام التعديل`
        );
      }
    }

    const productStockUpdates: Array<{ id: string; nextQty: number }> = [];
    for (const p of dbProducts) {
      const nextQty =
        (effectiveStock.get(p.id) ?? p.stockQuantity) -
        (newRequestedByProduct.get(p.id) ?? 0);
      if (nextQty !== p.stockQuantity) {
        productStockUpdates.push({ id: p.id, nextQty });
      }
    }

    const { subtotal, taxType, taxValue, taxAmount, totalAmount } =
      calculateSaleDecimals(input.items, input.taxType, input.taxValue);
    const directCost = new Prisma.Decimal(input.directCost ?? 0);

    const oldCashAmount =
      oldInvoice.paymentStatus === "PAID" && oldInvoice.safeId
        ? oldInvoice.totalAmount.gt(0)
          ? oldInvoice.totalAmount
          : oldInvoice.totalRevenue
        : new Prisma.Decimal(0);
    const newCashAmount =
      input.paymentStatus === "PAID" ? totalAmount : new Prisma.Decimal(0);

    const safeOps: Promise<unknown>[] = [];
    const targetSafeId = newSafe?.id ?? null;

    if (
      oldInvoice.paymentStatus === "PAID" &&
      oldInvoice.safeId &&
      input.paymentStatus === "PAID" &&
      targetSafeId === oldInvoice.safeId
    ) {
      const netDelta = newCashAmount.minus(oldCashAmount);
      if (netDelta.lt(0) && newSafe && newSafe.balance.lt(netDelta.abs())) {
        throw new InsufficientBalanceError(
          `الرصيد المتاح في "${newSafe.name}" غير كافٍ لخصم فارق تعديل الفاتورة`
        );
      }
      if (!netDelta.eq(0)) {
        safeOps.push(
          tx.safe.update({
            where: { id: newSafe!.id },
            data: { balance: { increment: netDelta } },
          })
        );
      }
    } else {
      if (oldInvoice.paymentStatus === "PAID" && oldInvoice.safeId) {
        if (oldInvoice.safe && oldInvoice.safe.balance.lt(oldCashAmount)) {
          throw new InsufficientBalanceError(
            `الرصيد المتاح في "${oldInvoice.safe.name}" غير كافٍ لاسترداد قيمة الفاتورة السابقة`
          );
        }
        safeOps.push(
          tx.safe.update({
            where: { id: oldInvoice.safeId },
            data: { balance: { decrement: oldCashAmount } },
          })
        );
      }
      if (input.paymentStatus === "PAID" && targetSafeId) {
        safeOps.push(
          tx.safe.update({
            where: { id: targetSafeId },
            data: { balance: { increment: newCashAmount } },
          })
        );
      }
    }

    const summaryEntries = input.items.map((item) => ({
      name: productMap.get(item.productId)!.name,
      quantity: item.quantity,
    }));
    const invoiceCode = `#S-${oldInvoice.id.slice(-5).toUpperCase()}`;

    const [updatedInvoice] = await Promise.all([
      tx.salesInvoice.update({
        where: { id: oldInvoice.id },
        data: {
          safeId: targetSafeId,
          customerName: input.customerName || null,
          paymentStatus: input.paymentStatus,
          subtotal,
          taxType,
          taxValue,
          taxAmount,
          totalAmount,
          totalRevenue: totalAmount,
          directCost,
          notes: input.notes || null,
          createdAt: resolveInvoiceCreatedAt(
            input.invoiceDate,
            oldInvoice.createdAt
          ),
          collectedAt:
            input.paymentStatus === "PAID"
              ? oldInvoice.collectedAt ?? new Date()
              : null,
          items: {
            deleteMany: {},
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
      ...productStockUpdates.map((upd) =>
        tx.product.update({
          where: { id: upd.id },
          data: { stockQuantity: upd.nextQty },
        })
      ),
      ...safeOps,
      writeAuditLog(tx, {
        companyId,
        actionType: "SALE_CREATED",
        summary: `تعديل فاتورة بيع ${invoiceCode}: ${summarizeItems(summaryEntries)} (الإجمالي: ${totalAmount.toFixed(2)} ج.م)`,
        amount: newCashAmount.minus(oldCashAmount),
      }),
    ]);

    return updatedInvoice;
  });
}

export async function deleteSaleForCompany(
  companyId: string,
  invoiceId: string
) {
  return runTransaction(async (tx) => {
    const invoice = await tx.salesInvoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        safe: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!invoice) {
      throw new BusinessRuleError("فاتورة البيع غير موجودة");
    }

    const invoiceCashAmount = invoice.totalAmount.gt(0)
      ? invoice.totalAmount
      : invoice.totalRevenue;

    if (invoice.paymentStatus === "PAID" && invoice.safeId) {
      if (invoice.safe && invoice.safe.balance.lt(invoiceCashAmount)) {
        throw new InsufficientBalanceError(
          `رصيد الخزينة "${invoice.safe.name}" غير كافٍ لاسترداد قيمة فاتورة البيع عند حذفها`
        );
      }
    }

    const qtyByProduct = new Map<string, number>();
    const summaryEntries: Array<{ name: string; quantity: number }> = [];

    for (const item of invoice.items) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity
      );
      summaryEntries.push({
        name: item.product.name,
        quantity: item.quantity,
      });
    }

    const invoiceCode = `#S-${invoice.id.slice(-5).toUpperCase()}`;

    await Promise.all([
      tx.salesInvoice.delete({
        where: { id: invoice.id },
      }),
      ...Array.from(qtyByProduct.entries()).map(([productId, qty]) =>
        tx.product.update({
          where: { id: productId },
          data: { stockQuantity: { increment: qty } },
        })
      ),
      ...(invoice.paymentStatus === "PAID" && invoice.safeId
        ? [
            tx.safe.update({
              where: { id: invoice.safeId },
              data: { balance: { decrement: invoiceCashAmount } },
            }),
          ]
        : []),
      writeAuditLog(tx, {
        companyId,
        actionType: "SAFE_ADJUSTED",
        summary: `حذف فاتورة بيع ${invoiceCode} واستعادة الكميات للمخزن: ${summarizeItems(summaryEntries)}`,
        amount:
          invoice.paymentStatus === "PAID"
            ? invoiceCashAmount.neg()
            : new Prisma.Decimal(0),
      }),
    ]);
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

    const amountToCollect = invoice.totalAmount.gt(0)
      ? invoice.totalAmount
      : invoice.totalRevenue;

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
          balance: { increment: amountToCollect },
        },
      }),
      writeAuditLog(tx, {
        companyId,
        actionType: "SALE_COLLECTED",
        summary: `تحصيل فاتورة مبيعات #${invoice.id.slice(-6).toUpperCase()} إلى ${safe.name}`,
        amount: amountToCollect,
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
  input: ParsedExpenseInput
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
  input: ParsedWithdrawalInput
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
