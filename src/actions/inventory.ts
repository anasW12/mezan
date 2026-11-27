"use server";

import { revalidatePath } from "next/cache";
import {
  formatActionError,
  requireTenantCompanyId,
  type ActionResult,
} from "@/lib/action-utils";
import {
  productUpdateSchema,
  type ProductUpdateInput,
} from "@/lib/validations/inventory";
import { updateProductForCompany } from "@/services/inventory.service";
import type { Product } from "@/types";

function revalidateInventoryRoutes() {
  revalidatePath("/inventory");
  revalidatePath("/purchases/new");
  revalidatePath("/sales/new");
  revalidatePath("/audit-logs");
  revalidatePath("/dashboard");
}

export async function updateProductAction(
  input: ProductUpdateInput
): Promise<ActionResult<Product>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = productUpdateSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات المنتج غير صالحة",
      };
    }

    const updated = await updateProductForCompany(companyId, parsed.data);
    revalidateInventoryRoutes();

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        sku: `#${updated.id.slice(-5).toUpperCase()}`,
        stockQuantity: updated.stockQuantity,
        averageCostPrice: updated.averageCostPrice.toNumber(),
        sellingPrice: updated.sellingPrice.toNumber(),
      },
    };
  } catch (error) {
    return formatActionError(error);
  }
}
