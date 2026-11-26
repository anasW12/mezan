import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BusinessRuleError } from "@/lib/action-utils";
import { InsufficientBalanceError } from "@/lib/errors";
import { writeAuditLog } from "@/services/audit.service";
import type {
  AdjustSafeInput,
  CreateFixedAssetInput,
  CreateSafeInput,
  UpdateCompanyInput,
} from "@/lib/validations/settings";

export async function getCompanySettingsData(companyId: string) {
  const [company, safes, fixedAssets] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, currency: true, planStatus: true },
    }),
    prisma.safe.findMany({
      where: { companyId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.fixedAsset.findMany({
      where: { companyId },
      orderBy: { purchaseDate: "desc" },
    }),
  ]);

  return { company, safes, fixedAssets };
}

export async function getSafesByCompany(companyId: string) {
  return prisma.safe.findMany({
    where: { companyId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function updateCompanyNameForCompany(
  companyId: string,
  input: UpdateCompanyInput
) {
  return prisma.company.update({
    where: { id: companyId },
    data: { name: input.name },
  });
}

export async function createSafeForCompany(
  companyId: string,
  input: CreateSafeInput
) {
  return prisma.$transaction(async (tx) => {
    const initialBalance = new Prisma.Decimal(input.initialBalance ?? 0);

    const safe = await tx.safe.create({
      data: {
        companyId,
        name: input.name,
        balance: initialBalance,
        isDefault: false,
      },
    });

    if (initialBalance.gt(0)) {
      await writeAuditLog(tx, {
        companyId,
        actionType: "SAFE_ADJUSTED",
        summary: `إنشاء خزينة "${safe.name}" برصيد افتتاحي`,
        amount: initialBalance,
      });
    }

    return safe;
  });
}

export async function adjustSafeBalanceForCompany(
  companyId: string,
  input: AdjustSafeInput
) {
  return prisma.$transaction(async (tx) => {
    const safe = await tx.safe.findFirst({
      where: { id: input.safeId, companyId },
    });

    if (!safe) {
      throw new BusinessRuleError("الخزينة المختارة غير موجودة");
    }

    const delta = new Prisma.Decimal(input.amount);
    const nextBalance = safe.balance.plus(delta);

    if (nextBalance.lt(0)) {
      throw new InsufficientBalanceError(
        `لا يمكن خصم مبلغ يتجاوز الرصيد المتاح في "${safe.name}"`
      );
    }

    const updated = await tx.safe.update({
      where: { id: safe.id },
      data: { balance: nextBalance },
    });

    const directionLabel = delta.gt(0) ? "إيداع / تسوية زيادة" : "سحب / تسوية نقص";

    await writeAuditLog(tx, {
      companyId,
      actionType: "SAFE_ADJUSTED",
      summary: `${directionLabel} في "${safe.name}": ${input.reason}`,
      amount: delta,
    });

    return updated;
  });
}

export async function createFixedAssetForCompany(
  companyId: string,
  input: CreateFixedAssetInput
) {
  return prisma.$transaction(async (tx) => {
    const purchaseValue = new Prisma.Decimal(input.purchaseValue);
    const purchaseDate = new Date(input.purchaseDate);

    if (Number.isNaN(purchaseDate.getTime())) {
      throw new BusinessRuleError("تاريخ الشراء غير صالح");
    }

    const asset = await tx.fixedAsset.create({
      data: {
        companyId,
        name: input.name,
        purchaseValue,
        purchaseDate,
      },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "ASSET_ADDED",
      summary: `إضافة أصل ثابت: ${asset.name}`,
      amount: purchaseValue,
    });

    return asset;
  });
}

export async function deleteFixedAssetForCompany(
  companyId: string,
  assetId: string
) {
  return prisma.$transaction(async (tx) => {
    const asset = await tx.fixedAsset.findFirst({
      where: { id: assetId, companyId },
    });

    if (!asset) {
      throw new BusinessRuleError("الأصل الثابت غير موجود");
    }

    await tx.fixedAsset.delete({
      where: { id: asset.id },
    });

    await writeAuditLog(tx, {
      companyId,
      actionType: "ASSET_ADDED",
      summary: `حذف أصل ثابت: ${asset.name}`,
      amount: asset.purchaseValue.neg(),
    });
  });
}
