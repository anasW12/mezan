import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuditLogsByCompany } from "@/services/audit.service";
import type { KpiSummary } from "@/types";

interface DashboardAggRow {
  cashbox: Prisma.Decimal | null;
  inventoryValue: Prisma.Decimal | null;
  fixedAssets: Prisma.Decimal | null;
  generalExpenses: Prisma.Decimal | null;
  ownerWithdrawals: Prisma.Decimal | null;
  totalSalesRevenue: Prisma.Decimal | null;
  totalDirectCost: Prisma.Decimal | null;
  fundsUnderCollection: Prisma.Decimal | null;
  totalCogs: Prisma.Decimal | null;
}

export async function getDashboardData(companyId: string) {
  const [aggRows, recentLogs] = await Promise.all([
    prisma.$queryRaw<DashboardAggRow[]>`
      SELECT
        COALESCE((SELECT SUM(balance) FROM "Safe" WHERE "companyId" = ${companyId}), 0) AS "cashbox",
        COALESCE((SELECT SUM("stockQuantity"::numeric * "averageCostPrice") FROM "Product" WHERE "companyId" = ${companyId}), 0) AS "inventoryValue",
        COALESCE((SELECT SUM("purchaseValue") FROM "FixedAsset" WHERE "companyId" = ${companyId}), 0) AS "fixedAssets",
        COALESCE((SELECT SUM(amount) FROM "GeneralExpense" WHERE "companyId" = ${companyId}), 0) AS "generalExpenses",
        COALESCE((SELECT SUM(amount) FROM "OwnerWithdrawal" WHERE "companyId" = ${companyId}), 0) AS "ownerWithdrawals",
        COALESCE((SELECT SUM(CASE WHEN "subtotal" > 0 OR "totalAmount" > 0 THEN "subtotal" ELSE "totalRevenue" END) FROM "SalesInvoice" WHERE "companyId" = ${companyId}), 0) AS "totalSalesRevenue",
        COALESCE((SELECT SUM("directCost") FROM "SalesInvoice" WHERE "companyId" = ${companyId}), 0) AS "totalDirectCost",
        COALESCE((SELECT SUM(CASE WHEN "totalAmount" > 0 OR "subtotal" > 0 THEN "totalAmount" ELSE "totalRevenue" END) FROM "SalesInvoice" WHERE "companyId" = ${companyId} AND "paymentStatus" = 'PENDING_COLLECTION'), 0) AS "fundsUnderCollection",
        COALESCE((
          SELECT SUM(si."quantity"::numeric * si."unitCostSnapshot")
          FROM "SalesItem" AS si
          INNER JOIN "SalesInvoice" AS inv ON inv."id" = si."salesInvoiceId"
          WHERE inv."companyId" = ${companyId}
        ), 0) AS "totalCogs"
    `,
    getAuditLogsByCompany(companyId, 10),
  ]);

  const row = aggRows[0];
  const cashbox = new Prisma.Decimal(row?.cashbox ?? 0);
  const inventoryValue = new Prisma.Decimal(row?.inventoryValue ?? 0);
  const fixedAssets = new Prisma.Decimal(row?.fixedAssets ?? 0);
  const generalExpenses = new Prisma.Decimal(row?.generalExpenses ?? 0);
  const ownerWithdrawals = new Prisma.Decimal(row?.ownerWithdrawals ?? 0);
  const totalSalesRevenue = new Prisma.Decimal(row?.totalSalesRevenue ?? 0);
  const totalDirectCost = new Prisma.Decimal(row?.totalDirectCost ?? 0);
  const fundsUnderCollection = new Prisma.Decimal(
    row?.fundsUnderCollection ?? 0
  );
  const totalCogs = new Prisma.Decimal(row?.totalCogs ?? 0);

  // Net Profit = Sum(SalesInvoice.subtotal) - COGS - Sum(SalesInvoice.directCost) - Sum(GeneralExpense.amount)
  // Collected tax (taxAmount) is excluded from revenue/profit; Owner Withdrawals are strictly excluded.
  const netProfit = totalSalesRevenue
    .minus(totalCogs)
    .minus(totalDirectCost)
    .minus(generalExpenses);

  const kpis: KpiSummary = {
    cashbox: cashbox.toNumber(),
    inventoryValue: inventoryValue.toNumber(),
    fixedAssets: fixedAssets.toNumber(),
    generalExpenses: generalExpenses.toNumber(),
    netProfit: netProfit.toNumber(),
    fundsUnderCollection: fundsUnderCollection.toNumber(),
    ownerWithdrawals: ownerWithdrawals.toNumber(),
  };

  return { kpis, recentLogs };
}
