import { auth } from "@/lib/auth";
import {
  getCachedCompanyLayoutMeta,
  isCompanySubscriptionExpired,
} from "@/lib/company-cache";
import {
  InsufficientBalanceError,
  InsufficientStockError,
  UnauthorizedTenantError,
} from "@/lib/errors";
import { tenantWhere } from "@/lib/tenant";

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

export async function requireTenantCompanyId(): Promise<string> {
  const session = await auth();
  const { companyId } = tenantWhere(session);

  const company = await getCachedCompanyLayoutMeta(companyId);
  if (!company) {
    throw new UnauthorizedTenantError("الشركة غير موجودة أو تم تعطيل حسابها");
  }

  if (isCompanySubscriptionExpired(company)) {
    throw new BusinessRuleError(
      "انتهت صلاحية اشتراك الشركة. يرجى التجديد للمتابعة."
    );
  }

  return companyId;
}

export function formatActionError(error: unknown): ActionResult<never> {
  if (
    error instanceof InsufficientBalanceError ||
    error instanceof InsufficientStockError ||
    error instanceof UnauthorizedTenantError ||
    error instanceof BusinessRuleError
  ) {
    return { success: false, error: error.message };
  }

  console.error("Action execution error:", error);
  return {
    success: false,
    error: "حدث خطأ غير متوقع. حاول مرة أخرى.",
  };
}
