"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { invalidateCompanyMeta } from "@/lib/company-cache";
import { formatActionError, type ActionResult } from "@/lib/action-utils";
import { UnauthorizedTenantError } from "@/lib/errors";
import { updateCompanyPlanStatusForAdmin } from "@/services/admin.service";

const updatePlanSchema = z.object({
  companyId: z.string().trim().min(1, { error: "معرف الشركة مطلوب" }),
  planStatus: z.enum(["ACTIVE", "EXPIRED"]),
});

async function requirePlatformAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") {
    throw new UnauthorizedTenantError("هذه الصلاحية متاحة لمدير المنصة فقط");
  }
}

export async function updateCompanyPlanAction(
  input: z.infer<typeof updatePlanSchema>
): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
    const parsed = updatePlanSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات التحديث غير صالحة",
      };
    }

    await updateCompanyPlanStatusForAdmin(
      parsed.data.companyId,
      parsed.data.planStatus
    );

    invalidateCompanyMeta(parsed.data.companyId);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}
