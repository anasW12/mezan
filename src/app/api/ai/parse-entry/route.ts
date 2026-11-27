import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { serializeProduct, serializeSafe } from "@/lib/serializers";
import { parseEntryRequestSchema } from "@/lib/validations/ai";
import {
  AIConfigurationError,
  AIParseError,
  AIUnavailableError,
  parseArabicAccountingEntry,
} from "@/services/ai.service";
import { getProductsByCompany } from "@/services/inventory.service";
import { getSafesByCompany } from "@/services/settings.service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "يرجى تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    if (session.user.planStatus === "EXPIRED") {
      return NextResponse.json(
        {
          success: false,
          error: "انتهت صلاحية اشتراك الشركة. يرجى التجديد للمتابعة.",
        },
        { status: 403 }
      );
    }

    const rateLimit = checkUserRateLimit(session.user.id, 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى الانتظار ثانية واحدة قبل إرسال طلب جديد",
        },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "صيغة الطلب غير صالحة" },
        { status: 400 }
      );
    }

    const parsed = parseEntryRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "النص المدخل غير صالح",
        },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    const [dbProducts, dbSafes] = await Promise.all([
      getProductsByCompany(companyId),
      getSafesByCompany(companyId),
    ]);

    const preview = await parseArabicAccountingEntry({
      text: parsed.data.text,
      products: dbProducts.map(serializeProduct),
      safes: dbSafes.map(serializeSafe),
    });

    return NextResponse.json({ success: true, data: preview }, { status: 200 });
  } catch (error) {
    if (error instanceof AIConfigurationError || error instanceof AIUnavailableError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 503 }
      );
    }
    if (error instanceof AIParseError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 422 }
      );
    }
    console.error("POST /api/ai/parse-entry error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع أثناء تحليل العملية" },
      { status: 500 }
    );
  }
}
