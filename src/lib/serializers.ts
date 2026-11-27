import type {
  AuditLog as PrismaAuditLog,
  Product as PrismaProduct,
  Safe as PrismaSafe,
} from "@prisma/client";
import { formatDate, formatShortDate, formatTime } from "@/lib/utils";
import type { AuditLogEntry, Product, SafeAccount } from "@/types";

export function serializeProduct(product: PrismaProduct): Product {
  return {
    id: product.id,
    name: product.name,
    sku: `#${product.id.slice(-5).toUpperCase()}`,
    stockQuantity: product.stockQuantity,
    averageCostPrice: product.averageCostPrice.toNumber(),
    sellingPrice: product.sellingPrice.toNumber(),
  };
}

export function serializeSafe(safe: PrismaSafe): SafeAccount {
  return {
    id: safe.id,
    name: safe.name,
    balance: safe.balance.toNumber(),
    isDefault: safe.isDefault,
  };
}

export function serializeAuditLog(log: PrismaAuditLog): AuditLogEntry {
  const numericAmount = log.amount.toNumber();
  return {
    id: log.id,
    actionType: log.actionType,
    summary: log.summary,
    amount: numericAmount,
    isPositive: numericAmount >= 0,
    timeLabel: formatTime(log.createdAt),
    dateLabel: formatShortDate(log.createdAt),
  };
}

export function formatInvoiceItemsSummary(
  items: Array<{ quantity: number; product: { name: string } }>
): string {
  return items.map((item) => `${item.quantity}× ${item.product.name}`).join("، ");
}

export { formatDate };
