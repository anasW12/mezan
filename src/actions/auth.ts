"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma, type PlanStatus } from "@prisma/client";
import { invalidateCompanyMeta } from "@/lib/company-cache";
import { prisma, runTransaction } from "@/lib/prisma";
import {
  auth,
  GOOGLE_OAUTH_SENTINEL,
  isGoogleOAuthEnabled,
  signIn,
  signOut,
  unstable_update,
} from "@/lib/auth";
import {
  checkSlidingWindowRateLimit,
  getClientIp,
  resetSlidingWindowRateLimit,
} from "@/lib/rate-limit";
import {
  changePasswordSchema,
  loginSchema,
  normalizeEmail,
  registerSchema,
  setInitialPasswordSchema,
  type ChangePasswordInput,
  type LoginInput,
  type RegisterInput,
  type SetInitialPasswordInput,
} from "@/lib/validations/auth";

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DUPLICATE_EMAIL_ERROR =
  "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const ip = await getClientIp();
    const rate = checkSlidingWindowRateLimit({
      key: `register:ip:${ip}`,
      maxAttempts: 5,
      windowMs: AUTH_WINDOW_MS,
    });
    if (!rate.allowed) {
      return {
        success: false,
        error: "تم تجاوز الحد المسموح لمحاولات إنشاء الحساب. يرجى الانتظار قليلاً.",
      };
    }

    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات التسجيل غير صالحة",
      };
    }

    const { name, companyName, password } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: DUPLICATE_EMAIL_ERROR,
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const trialDays = Number(process.env.TRIAL_DURATION_DAYS ?? "14");
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const defaultCurrency = process.env.DEFAULT_CURRENCY ?? "EGP";

    try {
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
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          error: DUPLICATE_EMAIL_ERROR,
        };
      }
      throw error;
    }

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
  let accountRateKey: string | null = null;
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات الدخول غير صالحة",
      };
    }

    const email = normalizeEmail(parsed.data.email);
    const { password } = parsed.data;
    const ip = await getClientIp();

    const ipRate = checkSlidingWindowRateLimit({
      key: `login:ip:${ip}`,
      maxAttempts: 25,
      windowMs: AUTH_WINDOW_MS,
    });
    if (!ipRate.allowed) {
      return {
        success: false,
        error: "تم تجاوز الحد المسموح لمحاولات الدخول. يرجى المحاولة لاحقاً.",
      };
    }

    accountRateKey = `login:acct:${ip}:${email}`;
    const acctRate = checkSlidingWindowRateLimit({
      key: accountRateKey,
      maxAttempts: 5,
      windowMs: AUTH_WINDOW_MS,
    });
    if (!acctRate.allowed) {
      return {
        success: false,
        error:
          "تم قفل محاولات الدخول لهذا الحساب مؤقتاً لكثرة المحاولات الخاطئة. حاول بعد ١٥ دقيقة.",
      };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    resetSlidingWindowRateLimit(accountRateKey);

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

export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "يرجى تسجيل الدخول أولاً" };
    }

    const rate = checkSlidingWindowRateLimit({
      key: `pw-change:${session.user.id}`,
      maxAttempts: 5,
      windowMs: AUTH_WINDOW_MS,
    });
    if (!rate.allowed) {
      return {
        success: false,
        error: "تم تجاوز الحد المسموح لمحاولات تغيير كلمة المرور. انتظر قليلاً.",
      };
    }

    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات كلمة المرور غير صالحة",
      };
    }

    const { currentPassword, newPassword } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "الحساب غير موجود" };
    }

    if (!user.passwordHash || user.passwordHash === GOOGLE_OAUTH_SENTINEL) {
      return {
        success: false,
        error:
          "هذا الحساب مسجل عبر Google بدون كلمة مرور. يمكنك تعيين كلمة مرور أولية أولاً.",
      };
    }

    if (newPassword.toLowerCase() === user.email.toLowerCase()) {
      return {
        success: false,
        error: "لا يمكن استخدام البريد الإلكتروني نفسه ككلمة مرور",
      };
    }

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentValid) {
      return { success: false, error: "كلمة المرور الحالية غير صحيحة" };
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return {
        success: false,
        error: "كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية",
      };
    }

    const nextHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: nextHash },
    });

    return { success: true };
  } catch (error) {
    console.error("changePasswordAction error:", error);
    return {
      success: false,
      error: "حدث خطأ غير متوقع أثناء تحديث كلمة المرور",
    };
  }
}

export async function setInitialPasswordAction(
  input: SetInitialPasswordInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "يرجى تسجيل الدخول أولاً" };
    }

    const rate = checkSlidingWindowRateLimit({
      key: `pw-set:${session.user.id}`,
      maxAttempts: 5,
      windowMs: AUTH_WINDOW_MS,
    });
    if (!rate.allowed) {
      return {
        success: false,
        error: "تم تجاوز الحد المسموح. يرجى الانتظار قليلاً.",
      };
    }

    const parsed = setInitialPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "كلمة المرور غير صالحة",
      };
    }

    const { newPassword } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "الحساب غير موجود" };
    }

    if (user.passwordHash !== GOOGLE_OAUTH_SENTINEL) {
      return {
        success: false,
        error:
          "هذا الحساب يمتلك كلمة مرور بالفعل. استخدم خيار تغيير كلمة المرور.",
      };
    }

    if (newPassword.toLowerCase() === user.email.toLowerCase()) {
      return {
        success: false,
        error: "لا يمكن استخدام البريد الإلكتروني نفسه ككلمة مرور",
      };
    }

    const nextHash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.updateMany({
      where: { id: user.id, passwordHash: GOOGLE_OAUTH_SENTINEL },
      data: { passwordHash: nextHash },
    });

    if (updated.count === 0) {
      return {
        success: false,
        error: "تم تعيين كلمة مرور لهذا الحساب بالفعل",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("setInitialPasswordAction error:", error);
    return {
      success: false,
      error: "حدث خطأ غير متوقع أثناء تعيين كلمة المرور",
    };
  }
}

export async function googleLoginAction(): Promise<ActionResult | void> {
  if (!isGoogleOAuthEnabled) {
    console.warn("Google OAuth requested while credentials are not configured.");
    return {
      success: false,
      error:
        "خدمة الدخول بحساب Google غير متاحة حالياً. يمكنك الدخول بالبريد الإلكتروني وكلمة المرور.",
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
