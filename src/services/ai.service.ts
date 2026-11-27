import "@/lib/network-init";
import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { aiParseResponseSchema } from "@/lib/validations/ai";
import type { AIParsePreview, Product, SafeAccount } from "@/types";

const GEMINI_FLASH_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-4-hydrogen",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
] as const;

export class AIConfigurationError extends Error {
  constructor(
    message = "مفتاح Google Gemini API غير مضاف في .env.local — يرجى إضافة GOOGLE_GEMINI_API_KEY لتفعيل التحليل الذكي"
  ) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

export class AIUnavailableError extends Error {
  constructor(
    message = "تعذر الاتصال بخدمة Google Gemini حالياً بسبب بطء الشبكة أو ضغط مؤقت، يرجى المحاولة مرة أخرى."
  ) {
    super(message);
    this.name = "AIUnavailableError";
  }
}

export class AIParseError extends Error {
  constructor(
    message = "تعذر فهم تفاصيل العملية بدقة. جرّب ذكر نوع العملية (بيع / شراء / إضافة منتج / مصروف / إيداع / سحب) والمبلغ بوضوح."
  ) {
    super(message);
    this.name = "AIParseError";
  }
}

const ENTRY_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.STRING,
      enum: [
        "PURCHASE",
        "SALE",
        "EXPENSE",
        "WITHDRAWAL",
        "ADD_PRODUCT",
        "SAFE_DEPOSIT",
      ],
      description:
        "نوع العملية: ADD_PRODUCT (شراء وإدخال منتج/بضاعة جديدة للمخزن عبر فاتورة شراء تخصم من الخزينة)، PURCHASE (فاتورة شراء تخصم من الخزينة)، SALE (فاتورة بيع)، EXPENSE (مصروف تشغيل)، WITHDRAWAL (مسحوبات شخصية)، SAFE_DEPOSIT (إيداع رأس مال أو إضافة رصيد في الخزينة)",
    },
    paymentStatus: {
      type: Type.STRING,
      enum: ["PAID", "PENDING_COLLECTION"],
      nullable: true,
      description:
        "لعمليات البيع فقط: PAID إذا كان مدفوعاً نقداً، أو PENDING_COLLECTION إذا كان تحت التحصيل / آجل / دفع عند الاستلام COD",
    },
    safeId: {
      type: Type.STRING,
      nullable: true,
      description: "معرف الخزينة المطابق من قائمة الخزائن المتاحة أو null",
    },
    safeName: {
      type: Type.STRING,
      description: "اسم الخزينة المستخدمة أو اسم الخزينة الافتراضية",
    },
    supplierName: {
      type: Type.STRING,
      nullable: true,
      description: "اسم المورد في فواتير الشراء إن ذُكر",
    },
    customerName: {
      type: Type.STRING,
      nullable: true,
      description: "اسم العميل في فواتير البيع إن ذُكر",
    },
    directCost: {
      type: Type.NUMBER,
      nullable: true,
      description: "تكلفة الشحن والتغليف المباشرة على فاتورة البيع إن ذُكرت",
    },
    category: {
      type: Type.STRING,
      nullable: true,
      description:
        "تصنيف المصروف العام مثل: إعلانات وتسويق، إيجار ومرافق، رواتب، تشغيل عام، أخرى",
    },
    description: {
      type: Type.STRING,
      nullable: true,
      description: "وصف المصروف العام أو ملاحظات المسحوبات الشخصية أو سبب الإيداع في الخزينة",
    },
    productName: {
      type: Type.STRING,
      nullable: true,
      description: "اسم المنتج عند اختيار ADD_PRODUCT",
    },
    stockQuantity: {
      type: Type.INTEGER,
      nullable: true,
      description: "الكمية الابتدائية للمنتج عند اختيار ADD_PRODUCT",
    },
    averageCostPrice: {
      type: Type.NUMBER,
      nullable: true,
      description: "سعر التكلفة للوحدة عند اختيار ADD_PRODUCT",
    },
    sellingPrice: {
      type: Type.NUMBER,
      nullable: true,
      description: "سعر البيع للوحدة عند اختيار ADD_PRODUCT أو إذا ذُكر سعر البيع مع المنتج",
    },
    items: {
      type: Type.ARRAY,
      nullable: true,
      description: "بنود المنتجات في حالة SALE أو PURCHASE فقط",
      items: {
        type: Type.OBJECT,
        properties: {
          productId: {
            type: Type.STRING,
            nullable: true,
            description: "معرف المنتج المطابق من القائمة المتاحة أو null",
          },
          productName: {
            type: Type.STRING,
            description: "اسم المنتج بالعربي",
          },
          quantity: {
            type: Type.INTEGER,
            description: "الكمية المطلوبة (رقم صحيح موجب)",
          },
          unitPrice: {
            type: Type.NUMBER,
            description: "سعر الوحدة الواحدة بالجنيه المصري",
          },
        },
        required: ["productName", "quantity", "unitPrice"],
      },
    },
    totalAmount: {
      type: Type.NUMBER,
      description: "إجمالي المبلغ بالجنيه المصري",
    },
    arabicSummary: {
      type: Type.STRING,
      description: "ملخص عربي احترافي قصير وواضح للعملية",
    },
  },
  required: ["action", "safeName", "totalAmount", "arabicSummary"],
};

function getActionLabel(
  action: AIParsePreview["action"],
  paymentStatus?: "PAID" | "PENDING_COLLECTION"
): string {
  switch (action) {
    case "ADD_PRODUCT":
      return "إضافة منتج للمخزن";
    case "SAFE_DEPOSIT":
      return "إيداع في الخزينة";
    case "SALE":
      return paymentStatus === "PENDING_COLLECTION"
        ? "فاتورة بيع (تحت التحصيل COD)"
        : "فاتورة بيع (مدفوعة)";
    case "PURCHASE":
      return "فاتورة شراء";
    case "EXPENSE":
      return "مصروف عام";
    case "WITHDRAWAL":
      return "مسحوبات شخصية";
  }
}

function cleanNullableId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed === "undefined") {
    return null;
  }
  return trimmed;
}

function isRetryableGeminiError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const errObj = error as { status?: unknown; message?: unknown; cause?: unknown };
    if (
      typeof errObj.status === "number" &&
      (errObj.status === 404 || errObj.status === 429 || errObj.status === 503)
    ) {
      return true;
    }
    if (
      error instanceof TypeError ||
      (typeof errObj.message === "string" &&
        (errObj.message.includes("fetch failed") ||
          errObj.message.includes("ETIMEDOUT") ||
          errObj.message.includes("ECONNRESET") ||
          errObj.message.includes("network")))
    ) {
      return true;
    }
    if (errObj.cause) {
      return true;
    }
  }
  return false;
}

function sanitizeRawAiPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  const normalizedAction =
    typeof obj.action === "string" ? obj.action.trim().toUpperCase() : obj.action;

  const rawPaymentStatus =
    typeof obj.paymentStatus === "string"
      ? obj.paymentStatus.trim().toUpperCase()
      : null;
  const normalizedPaymentStatus =
    rawPaymentStatus === "PAID" || rawPaymentStatus === "PENDING_COLLECTION"
      ? rawPaymentStatus
      : null;

  const rawItems = Array.isArray(obj.items)
    ? obj.items
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item) => ({
          productId: cleanNullableId(
            typeof item.productId === "string" ? item.productId : null
          ),
          productName:
            typeof item.productName === "string" && item.productName.trim()
              ? item.productName.trim()
              : "منتج",
          quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
          unitPrice: Math.max(0, Number(item.unitPrice) || 0),
        }))
    : null;

  return {
    ...obj,
    action: normalizedAction,
    paymentStatus: normalizedPaymentStatus,
    safeId: cleanNullableId(typeof obj.safeId === "string" ? obj.safeId : null),
    safeName:
      typeof obj.safeName === "string" && obj.safeName.trim()
        ? obj.safeName.trim()
        : "الخزينة الرئيسية",
    directCost:
      obj.directCost === null || obj.directCost === undefined
        ? 0
        : Math.max(0, Number(obj.directCost) || 0),
    stockQuantity:
      obj.stockQuantity === null || obj.stockQuantity === undefined
        ? null
        : Math.max(0, Math.round(Number(obj.stockQuantity) || 0)),
    averageCostPrice:
      obj.averageCostPrice === null || obj.averageCostPrice === undefined
        ? null
        : Math.max(0, Number(obj.averageCostPrice) || 0),
    sellingPrice:
      obj.sellingPrice === null || obj.sellingPrice === undefined
        ? null
        : Math.max(0, Number(obj.sellingPrice) || 0),
    totalAmount: Math.max(0, Number(obj.totalAmount) || 0),
    items: rawItems,
  };
}

export async function parseArabicAccountingEntry(params: {
  text: string;
  products: Product[];
  safes: SafeAccount[];
}): Promise<AIParsePreview> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AIConfigurationError();
  }

  const ai = new GoogleGenAI({ apiKey });

  const defaultSafe =
    params.safes.find((s) => s.isDefault) ?? params.safes[0] ?? null;

  const productsContext =
    params.products.length > 0
      ? params.products
          .map(
            (p) =>
              `- id: "${p.id}", name: "${p.name}", stock: ${p.stockQuantity}, avgCost: ${p.averageCostPrice}, sellingPrice: ${p.sellingPrice}`
          )
          .join("\n")
      : "لا توجد منتجات مسجلة حالياً.";

  const safesContext =
    params.safes.length > 0
      ? params.safes
          .map(
            (s) =>
              `- id: "${s.id}", name: "${s.name}"${s.isDefault ? " (افتراضية)" : ""}`
          )
          .join("\n")
      : "- الخزينة الرئيسية";

  const systemInstruction = `أنت مساعد محاسبي ذكي لنظام "ميزان" للمحاسبة والمخزون السحابي في مصر.
مهمتك تحليل النص العربي العامي أو الفصيح وتحويله بدقة إلى كائن JSON منظم فقط.

قواعد حاسمة:
1. ميّز بدقة بين الـ 6 عمليات:
   - ADD_PRODUCT: عندما يطلب المستخدم "إضافة منتج" أو "ضيف في المخزن" أو "ضيف في البضاعة في المخزن" أو "سجل صنف جديد" (تُسجل كفاتورة شراء رسمية تُنشئ الصنف وتُضيف رصيده للمخزن وتخصم التكلفة الإجمالية من الخزينة المحددة). ضع البيانات في productName و stockQuantity و averageCostPrice و sellingPrice و safeId/safeName (إذا ذُكر سعر واحد فقط مثل "سعر الوحدة 50000" فضع averageCostPrice = 50000 و sellingPrice = 50000، واجعل totalAmount = stockQuantity * averageCostPrice).
   - PURCHASE: عند ذكر "اشتريت" أو "فاتورة شراء" (تخصم من الخزينة).
   - SALE: عند ذكر "بعت" أو "بيع" أو "فاتورة بيع" (إذا ذُكر "عند الاستلام" أو "تحت التحصيل" أو "آجل" أو "شحن COD" فاجعل paymentStatus = "PENDING_COLLECTION"، وإلا "PAID"). وإذا ذُكرت تكلفة شحن/تغليف ضعها في directCost.
   - EXPENSE: مصروف تشغيل للشركة (إيجار، كهرباء، إنترنت، إعلانات، رواتب، نقل، صيانة...).
   - WITHDRAWAL: مسحوبات شخصية للمالك.
   - SAFE_DEPOSIT: عندما يطلب المستخدم إضافة أو إيداع فلوس في الخزينة أو حساب الكاش أو رأس المال (مثل: "ضيف 5000 في الخزينة" أو "إيداع 10000 في الكاش"). ضع المبلغ في totalAmount والسبب في description.
2. طابق أسماء المنتجات في SALE و PURCHASE مع قائمة منتجات الشركة التالية واكتب productId الصحيح إن أمكن:
${productsContext}
3. طابق الخزينة مع قائمة خزائن الشركة التالية، وإذا لم يذكر المستخدم خزينة استخدم الخزينة الافتراضية:
${safesContext}
4. تأكد أن unitPrice هو سعر الوحدة الواحدة وليس الإجمالي (مثلاً: "اشتريت ١٠ تيشيرتات بـ ٥٠٠ جنيه جملة" => quantity: 10, unitPrice: 50 إلا إذا قال "بسعر ٥٠ للقطعة").`;

  let rawText = "";
  let lastError: unknown;
  let allRetryable = true;

  for (const modelName of GEMINI_FLASH_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.text,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: ENTRY_RESPONSE_SCHEMA,
        },
      });
      rawText = response.text?.trim() ?? "";
      if (rawText) {
        allRetryable = false;
        break;
      }
    } catch (error) {
      lastError = error;
      if (isRetryableGeminiError(error)) {
        continue;
      }
      allRetryable = false;
      throw error;
    }
  }

  if (!rawText) {
    if (lastError) {
      console.error("All Gemini models failed:", lastError);
      if (allRetryable) {
        throw new AIUnavailableError();
      }
    }
    throw new AIParseError();
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(rawText);
  } catch {
    console.warn("Gemini returned non-JSON output:", rawText);
    throw new AIParseError();
  }

  const sanitized = sanitizeRawAiPayload(rawJson);
  const validated = aiParseResponseSchema.safeParse(sanitized);
  if (!validated.success) {
    console.warn("AI JSON schema mismatch:", validated.error.issues, rawJson);
    throw new AIParseError();
  }

  const data = validated.data;

  const matchedSafe =
    params.safes.find((s) => s.id === data.safeId) ??
    params.safes.find((s) =>
      s.name.toLowerCase().includes(data.safeName.trim().toLowerCase())
    ) ??
    defaultSafe;

  if (data.action === "ADD_PRODUCT") {
    const firstItem = data.items?.[0];
    const prodName =
      data.productName?.trim() ||
      firstItem?.productName?.trim() ||
      data.description?.trim() ||
      "منتج جديد";
    const qty = data.stockQuantity ?? firstItem?.quantity ?? 0;
    const cost =
      data.averageCostPrice ??
      firstItem?.unitPrice ??
      (qty > 0 && data.totalAmount > 0 ? data.totalAmount / qty : 0);
    const sellPrice =
      data.sellingPrice && data.sellingPrice > 0 ? data.sellingPrice : cost;

    return {
      action: "ADD_PRODUCT",
      actionLabel: getActionLabel("ADD_PRODUCT"),
      safeId: matchedSafe?.id ?? null,
      safeName: matchedSafe?.name ?? data.safeName,
      productFields: {
        name: prodName,
        stockQuantity: qty,
        averageCostPrice: cost,
        sellingPrice: sellPrice,
      },
      totalAmount: qty * cost,
      arabicSummary: data.arabicSummary,
    };
  }

  if (data.action === "SAFE_DEPOSIT") {
    return {
      action: "SAFE_DEPOSIT",
      actionLabel: getActionLabel("SAFE_DEPOSIT"),
      safeId: matchedSafe?.id ?? null,
      safeName: matchedSafe?.name ?? data.safeName,
      description: data.description?.trim() || data.arabicSummary,
      totalAmount: data.totalAmount,
      arabicSummary: data.arabicSummary,
    };
  }

  let normalizedItems = (data.items ?? []).map((item) => {
    const matchedProduct =
      params.products.find((p) => p.id === item.productId) ??
      params.products.find((p) => {
        const a = p.name.trim().toLowerCase();
        const b = item.productName.trim().toLowerCase();
        return a === b || a.includes(b) || b.includes(a);
      }) ??
      null;

    return {
      productId: matchedProduct?.id ?? null,
      productName: matchedProduct?.name ?? item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sellingPrice:
        matchedProduct?.sellingPrice ??
        (data.sellingPrice && data.sellingPrice > 0
          ? data.sellingPrice
          : item.unitPrice),
      createIfMissing: data.action === "PURCHASE" && !matchedProduct,
    };
  });

  const isInvoiceAction =
    data.action === "SALE" || data.action === "PURCHASE";

  if (isInvoiceAction && normalizedItems.length === 0) {
    const fallbackProd =
      params.products.length === 1 ? params.products[0] : null;
    normalizedItems = [
      {
        productId: fallbackProd?.id ?? null,
        productName:
          fallbackProd?.name ??
          data.productName?.trim() ??
          data.description?.trim() ??
          "صنف غير محدد",
        quantity: data.stockQuantity && data.stockQuantity > 0 ? data.stockQuantity : 1,
        unitPrice: data.totalAmount,
        sellingPrice: fallbackProd?.sellingPrice ?? data.totalAmount,
        createIfMissing: data.action === "PURCHASE" && !fallbackProd,
      },
    ];
  }

  const computedItemsTotal = normalizedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const finalTotal =
    isInvoiceAction && normalizedItems.length > 0 && computedItemsTotal > 0
      ? computedItemsTotal
      : data.totalAmount;

  const paymentStatus =
    data.action === "SALE" ? data.paymentStatus ?? "PAID" : undefined;

  return {
    action: data.action,
    actionLabel: getActionLabel(data.action, paymentStatus),
    paymentStatus,
    safeId: matchedSafe?.id ?? null,
    safeName: matchedSafe?.name ?? data.safeName,
    supplierName: data.supplierName ?? null,
    customerName: data.customerName ?? null,
    directCost: data.directCost ?? 0,
    category: data.category ?? "تشغيل عام",
    description: data.description ?? data.arabicSummary,
    items: isInvoiceAction ? normalizedItems : undefined,
    totalAmount: finalTotal,
    arabicSummary: data.arabicSummary,
  };
}
