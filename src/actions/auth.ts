"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import type { PlanStatus } from "@prisma/client";
import { invalidateCompanyMeta } from "@/lib/company-cache";
import { prisma, runTransaction } from "@/lib/prisma";
import {
  auth,
  isGoogleOAuthEnabled,
  signIn,
  signOut,
  unstable_update,
} from "@/lib/auth";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات التسجيل غير صالحة",
      };
    }

    const { name, companyName, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: "هذا البريد الإلكتروني مسجل بالفعل",
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const trialDays = Number(process.env.TRIAL_DURATION_DAYS ?? "14");
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const defaultCurrency = process.env.DEFAULT_CURRENCY ?? "EGP";

    await runTransaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          currency: defaultCurrency,
          planStatus: "TRIAL",
          trialEndsAt,
        },
      });

      await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "OWNER",
          companyId: company.id,
        },
      });

      await tx.safe.create({
        data: {
          companyId: company.id,
          name: "الخزينة الرئيسية",
          balance: 0,
          isDefault: true,
        },
      });
    });

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return {
      success: true,
      data: { redirectTo: "/dashboard" },
    };
  } catch (error) {
    console.error("registerAction error:", error);
    return {
      success: false,
      error: "حدث خطأ غير متوقع. حاول مرة أخرى.",
    };
  }
}

export async function loginAction(
  input: LoginInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات الدخول غير صالحة",
      };
    }

    const { email, password } = parsed.data;

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    const redirectTo = user?.role === "PLATFORM_ADMIN" ? "/admin" : "/dashboard";

    return {
      success: true,
      data: { redirectTo },
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      };
    }
    console.error("loginAction error:", error);
    return {
      success: false,
      error: "حدث خطأ غير متوقع. حاول مرة أخرى.",
    };
  }
}

export async function googleLoginAction(): Promise<ActionResult | void> {
  if (!isGoogleOAuthEnabled) {
    return {
      success: false,
      error:
        "الدخول بحساب Google يتطلب إضافة GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET في ملف البيئة",
    };
  }
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function refreshSubscriptionAction(): Promise<
  ActionResult<{ planStatus: PlanStatus }>
> {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "يرجى تسجيل الدخول أولاً" };
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { id: true, planStatus: true, trialEndsAt: true },
    });

    if (!company) {
      return { success: false, error: "الشركة غير موجودة" };
    }

    let effectiveStatus: PlanStatus = company.planStatus;
    if (
      company.planStatus === "TRIAL" &&
      Date.now() > company.trialEndsAt.getTime()
    ) {
      await prisma.company.update({
        where: { id: company.id },
        data: { planStatus: "EXPIRED" },
      });
      invalidateCompanyMeta(company.id);
      effectiveStatus = "EXPIRED";
    } else {
      invalidateCompanyMeta(company.id);
    }

    await unstable_update({
      user: {
        planStatus: effectiveStatus,
        trialEndsAt: company.trialEndsAt.toISOString(),
      },
    });

    return {
      success: true,
      data: { planStatus: effectiveStatus },
    };
  } catch (error) {
    console.error("refreshSubscriptionAction error:", error);
    return {
      success: false,
      error: "تعذر التحقق من حالة الاشتراك حالياً",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
