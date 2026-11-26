"use server";

import { revalidatePath } from "next/cache";
import {
  formatActionError,
  requireTenantCompanyId,
  type ActionResult,
} from "@/lib/action-utils";
import {
  adjustSafeSchema,
  createFixedAssetSchema,
  createSafeSchema,
  deleteFixedAssetSchema,
  updateCompanySchema,
  type AdjustSafeInput,
  type CreateFixedAssetInput,
  type CreateSafeInput,
  type UpdateCompanyInput,
} from "@/lib/validations/settings";
import {
  adjustSafeBalanceForCompany,
  createFixedAssetForCompany,
  createSafeForCompany,
  deleteFixedAssetForCompany,
  updateCompanyNameForCompany,
} from "@/services/settings.service";

function revalidateSettingsRoutes() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/audit-logs");
  revalidatePath("/purchases/new");
  revalidatePath("/sales/new");
  revalidatePath("/expenses");
  revalidatePath("/withdrawals");
  revalidatePath("/", "layout");
}

export async function updateCompanyAction(
  input: UpdateCompanyInput
): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = updateCompanySchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "اسم الشركة غير صالح",
      };
    }

    await updateCompanyNameForCompany(companyId, parsed.data);
    revalidateSettingsRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function createSafeAction(
  input: CreateSafeInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = createSafeSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات الخزينة غير صالحة",
      };
    }

    const safe = await createSafeForCompany(companyId, parsed.data);
    revalidateSettingsRoutes();

    return { success: true, data: { id: safe.id } };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function adjustSafeBalanceAction(
  input: AdjustSafeInput
): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = adjustSafeSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات تسوية الخزينة غير صالحة",
      };
    }

    await adjustSafeBalanceForCompany(companyId, parsed.data);
    revalidateSettingsRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function createFixedAssetAction(
  input: CreateFixedAssetInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = createFixedAssetSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات الأصل الثابت غير صالحة",
      };
    }

    const asset = await createFixedAssetForCompany(companyId, parsed.data);
    revalidateSettingsRoutes();

    return { success: true, data: { id: asset.id } };
  } catch (error) {
    return formatActionError(error);
  }
}

export async function deleteFixedAssetAction(
  id: string
): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = deleteFixedAssetSchema.safeParse({ id });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "معرف الأصل غير صالح",
      };
    }

    await deleteFixedAssetForCompany(companyId, parsed.data.id);
    revalidateSettingsRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}
