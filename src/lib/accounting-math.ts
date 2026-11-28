import { Prisma } from "@prisma/client";
import type { TaxType } from "@/types";

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
    return new Prisma.Decimal(0);
  }

  const oldTotalValue = oldAvgCost.mul(oldQty);
  const newTotalValue = newUnitCost.mul(newQty);
  return oldTotalValue.plus(newTotalValue).div(totalQty);
}

/**
 * Reverses a previous purchase contribution from weighted average cost.
 * Clamps safely to 0 if remaining quantity or residual value drops to <= 0.
 */
export function reverseWeightedAverageCost(
  currentQty: number,
  currentAvgCost: Prisma.Decimal,
  removedQty: number,
  removedUnitCost: Prisma.Decimal
): { remainingQty: number; nextAvgCost: Prisma.Decimal } {
  const remainingQty = currentQty - removedQty;
  if (remainingQty <= 0) {
    return {
      remainingQty: 0,
      nextAvgCost: new Prisma.Decimal(0),
    };
  }

  const currentTotalValue = currentAvgCost.mul(currentQty);
  const removedTotalValue = removedUnitCost.mul(removedQty);
  const remainingValue = currentTotalValue.minus(removedTotalValue);

  return {
    remainingQty,
    nextAvgCost: remainingValue.gt(0)
      ? remainingValue.div(remainingQty)
      : new Prisma.Decimal(0),
  };
}

/**
 * Computes Decimal(18, 4)-safe sales invoice subtotal, tax, and total on the server.
 */
export function calculateSaleDecimals(
  items: Array<{ quantity: number; unitPrice: number }>,
  taxType: TaxType = "PERCENTAGE",
  taxValue = 0
): {
  subtotal: Prisma.Decimal;
  taxType: TaxType;
  taxValue: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
} {
  const subtotal = items
    .reduce(
      (sum, item) =>
        sum.plus(new Prisma.Decimal(item.unitPrice).mul(item.quantity)),
      new Prisma.Decimal(0)
    )
    .toDecimalPlaces(2);

  const normalizedTaxValue = new Prisma.Decimal(taxValue || 0).toDecimalPlaces(
    2
  );

  const taxAmount =
    taxType === "PERCENTAGE"
      ? subtotal.mul(normalizedTaxValue).div(100).toDecimalPlaces(2)
      : normalizedTaxValue;

  const totalAmount = subtotal.plus(taxAmount).toDecimalPlaces(2);

  return {
    subtotal,
    taxType,
    taxValue: normalizedTaxValue,
    taxAmount,
    totalAmount,
  };
}

/**
 * Pure numeric helper for client-side live invoice summary preview.
 * Matches server calculation (2 decimal rounding on currency amounts).
 */
export function calculateSalePreviewNumbers(
  items: Array<{ quantity: number; unitPrice: number }>,
  taxType: TaxType,
  taxValue: number
): { subtotal: number; taxAmount: number; totalAmount: number } {
  const rawSubtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const subtotal = Math.round(rawSubtotal * 100) / 100;
  const safeTaxValue = Math.max(0, Number(taxValue) || 0);
  const rawTax =
    taxType === "PERCENTAGE"
      ? (subtotal * Math.min(100, safeTaxValue)) / 100
      : safeTaxValue;
  const taxAmount = Math.round(rawTax * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return { subtotal, taxAmount, totalAmount };
}

/**
 * Formats a Date as YYYY-MM-DD (UTC date key consistent across Cairo/server).
 */
export function toDateInputString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolves a YYYY-MM-DD date input safely without UTC midnight timezone shift.
 * Preserves the exact original timestamp if the calendar date did not change.
 */
export function resolveInvoiceCreatedAt(
  dateStr?: string,
  existingDate?: Date
): Date {
  const trimmed = dateStr?.trim();
  if (!trimmed) {
    return existingDate ?? new Date();
  }

  const todayStr = toDateInputString(new Date());
  if (existingDate && trimmed === toDateInputString(existingDate)) {
    return existingDate;
  }
  if (!existingDate && trimmed === todayStr) {
    return new Date();
  }

  const parsed = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return existingDate ?? new Date();
  }
  return parsed;
}
