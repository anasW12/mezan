import { Prisma, type ActionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditTx = Prisma.TransactionClient | typeof prisma;

export interface CreateAuditLogParams {
  companyId: string;
  actionType: ActionType;
  summary: string;
  amount: Prisma.Decimal | number | string;
}

/**
 * Append-only immutable audit log writer.
 * NEVER add update or delete methods to this service.
 */
export async function writeAuditLog(
  tx: AuditTx,
  params: CreateAuditLogParams
) {
  return tx.auditLog.create({
    data: {
      companyId: params.companyId,
      actionType: params.actionType,
      summary: params.summary,
      amount: new Prisma.Decimal(params.amount),
    },
  });
}

export async function getAuditLogsByCompany(
  companyId: string,
  limit = 200
) {
  return prisma.auditLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
