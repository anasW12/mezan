"use server";

import { revalidatePath } from "next/cache";
import {
  formatActionError,
  requireTenantCompanyId,
  type ActionResult,
} from "@/lib/action-utils";
import {
  productCreateSchema,
  productDeleteSchema,
  productUpdateSchema,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@/lib/validations/inventory";
import {
  createProductForCompany,
  deleteProductForCompany,
  updateProductForCompany,
} from "@/services/inventory.service";
import type { Product } from "@/types";

function revalidateInventoryRoutes() {
  revalidatePath("/inventory");
  revalidatePath("/purchases/new");
  revalidatePath("/sales/new");
  revalidatePath("/audit-logs");
  revalidatePath("/dashboard");
}

export async function createProductAction(
  input: ProductCreateInput
): Promise<ActionResult<Product>> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = productCreateSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات المنتج غير صالحة",
      };
    }

    const created = await createProductForCompany(companyId, parsed.data);
    revalidateInventoryRoutes();

    return {
      success: true,
      data: {
        id: created.id,
        name: created.name,
        sku: `#${created.id.slice(-5).toUpperCase()}`,
        stockQuantity: created.stockQuantity,
        averageCostPrice: created.averageCostPrice.toNumber(),
        sellingPrice: created.sellingPrice.toNumber(),
      },
    };
  } catch (error) {
    return formatActionError(error);
  }
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

export async function deleteProductAction(
  id: string
): Promise<ActionResult> {
  try {
    const companyId = await requireTenantCompanyId();
    const parsed = productDeleteSchema.safeParse({ id });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "معرف المنتج غير صالح",
      };
    }

    await deleteProductForCompany(companyId, parsed.data.id);
    revalidateInventoryRoutes();

    return { success: true };
  } catch (error) {
    return formatActionError(error);
  }
}
