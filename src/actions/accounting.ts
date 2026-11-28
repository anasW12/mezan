"use server";

import { revalidatePath } from "next/cache";
import {
  formatActionError,
  requireTenantCompanyId,
  type ActionResult,
} from "@/lib/action-utils";
import {
  expenseSchema,
  purchaseSchema,
  recordIdSchema,
  saleSchema,
  settleSaleSchema,
  updatePurchaseSchema,
  updateSaleSchema,
  withdrawalSchema,
  type ExpenseInput,
  type PurchaseInput,
  type SaleInput,
  type SettleSaleInput,
  type UpdatePurchaseInput,
  type UpdateSaleInput,
  type WithdrawalInput,
} from "@/lib/validations/accounting";
import {
  createExpenseForCompany,
  createPurchaseForCompany,
  createSaleForCompany,
  createWithdrawalForCompany,
  deleteExpenseForCompany,
  deletePurchaseForCompany,
  deleteSaleForCompany,
  deleteWithdrawalForCompany,
  settleSaleForCompany,
  updatePurchaseForCompany,
  updateSaleForCompany,
} from "@/services/accounting.service";

function revalidateAccountingRoutes() {
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/purchases");
  revalidatePath("/purchases/new");
  revalidatePath("/sales");
  revalidatePath("/sales/new");
  revalidatePath("/expenses");
  revalidatePath("/withdrawals");
  revalidatePath("/audit-logs");
  revalidatePath("/settings");
}

export async function createPurchaseAction(
  input: PurchaseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = purchaseSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات فاتورة الشراء غير صالحة",
      };
    }

    const invoice = await createPurchaseForCompany(companyId, parsed.data);
    revalidateAccountingRoutes();

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function updatePurchaseAction(
  input: UpdatePurchaseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = updatePurchaseSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات تعديل فاتورة الشراء غير صالحة",
      };
    }

    const invoice = await updatePurchaseForCompany(companyId, parsed.data);
    revalidateAccountingRoutes();
    revalidatePath(`/purchases/${invoice.id}/edit`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function deletePurchaseAction(id: string): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = recordIdSchema.safeParse({ id });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "معرف فاتورة الشراء غير صالح",
      };
    }

    await deletePurchaseForCompany(companyId, parsed.data.id);
    revalidateAccountingRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function createSaleAction(
  input: SaleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = saleSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات فاتورة البيع غير صالحة",
      };
    }

    const invoice = await createSaleForCompany(companyId, parsed.data);
    revalidateAccountingRoutes();

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function updateSaleAction(
  input: UpdateSaleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = updateSaleSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات تعديل فاتورة البيع غير صالحة",
      };
    }

    const invoice = await updateSaleForCompany(companyId, parsed.data);
    revalidateAccountingRoutes();
    revalidatePath(`/sales/${invoice.id}/edit`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function deleteSaleAction(id: string): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = recordIdSchema.safeParse({ id });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "معرف فاتورة البيع غير صالح",
      };
    }

    await deleteSaleForCompany(companyId, parsed.data.id);
    revalidateAccountingRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function settleSaleAction(
  input: SettleSaleInput
): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = settleSaleSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "معرف الفاتورة غير صالح",
      };
    }

    await settleSaleForCompany(companyId, parsed.data);
    revalidateAccountingRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function createExpenseAction(
  input: ExpenseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = expenseSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات المصروف غير صالحة",
      };
    }

    const expense = await createExpenseForCompany(companyId, parsed.data);
    revalidateAccountingRoutes();

    return { success: true, data: { id: expense.id } };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = recordIdSchema.safeParse({ id });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "معرف المصروف غير صالح",
      };
    }

    await deleteExpenseForCompany(companyId, parsed.data.id);
    revalidateAccountingRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function createWithdrawalAction(
  input: WithdrawalInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = withdrawalSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات المسحوبات غير صالحة",
      };
    }

    const withdrawal = await createWithdrawalForCompany(companyId, parsed.data);
    revalidateAccountingRoutes();

    return { success: true, data: { id: withdrawal.id } };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function deleteWithdrawalAction(
  id: string
): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = recordIdSchema.safeParse({ id });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "معرف السحب غير صالح",
      };
    }

    await deleteWithdrawalForCompany(companyId, parsed.data.id);
    revalidateAccountingRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}
