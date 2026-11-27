import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatInvoiceItemsSummary } from "@/lib/serializers";
import { formatDate } from "@/lib/utils";
import { getDashboardData } from "@/services/dashboard.service";

function createRtlSheet(workbook: ExcelJS.Workbook, title: string) {
  const sheet = workbook.addWorksheet(title, {
    views: [{ rightToLeft: true }],
  });
  return sheet;
}

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF059669" },
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: "يرجى تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, currency: true, planStatus: true, trialEndsAt: true },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "الشركة غير موجودة" },
        { status: 404 }
      );
    }

    const isExpired =
      company.planStatus === "EXPIRED" ||
      (company.planStatus === "TRIAL" &&
        Date.now() > company.trialEndsAt.getTime());

    if (isExpired) {
      return NextResponse.json(
        {
          success: false,
          error: "انتهت صلاحية اشتراك الشركة. يرجى التجديد للمتابعة.",
        },
        { status: 403 }
      );
    }

    const [dashboardData, safes, fixedAssets, products] = await Promise.all([
      getDashboardData(companyId),
      prisma.safe.findMany({
        where: { companyId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
      prisma.fixedAsset.findMany({
        where: { companyId },
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.product.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const [
      salesInvoices,
      purchaseInvoices,
      expenses,
      withdrawals,
      auditLogs,
    ] = await Promise.all([
      prisma.salesInvoice.findMany({
        where: { companyId },
        include: {
          safe: { select: { name: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseInvoice.findMany({
        where: { companyId },
        include: {
          safe: { select: { name: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.generalExpense.findMany({
        where: { companyId },
        include: { safe: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ownerWithdrawal.findMany({
        where: { companyId },
        include: { safe: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "نظام ميزان للمحاسبة والمخزون";
    workbook.created = new Date();

    // 1. Summary
    const summarySheet = createRtlSheet(workbook, "الملخص المالي");
    summarySheet.columns = [
      { header: "البند", key: "metric", width: 32 },
      { header: `القيمة (${company.currency})`, key: "value", width: 22 },
    ];
    styleHeaderRow(summarySheet);
    summarySheet.addRows([
      { metric: "اسم الشركة", value: company.name },
      { metric: "الكاش في الخزينة", value: dashboardData.kpis.cashbox },
      { metric: "قيمة البضاعة في المخزن", value: dashboardData.kpis.inventoryValue },
      { metric: "الأصول الثابتة", value: dashboardData.kpis.fixedAssets },
      { metric: "المصروفات العامة", value: dashboardData.kpis.generalExpenses },
      { metric: "صافي ربح الفترة", value: dashboardData.kpis.netProfit },
      {
        metric: "فلوس تحت التحصيل (COD)",
        value: dashboardData.kpis.fundsUnderCollection,
      },
      { metric: "المسحوبات الشخصية", value: dashboardData.kpis.ownerWithdrawals },
    ]);

    // 2. Sales
    const salesSheet = createRtlSheet(workbook, "المبيعات");
    salesSheet.columns = [
      { header: "رقم الفاتورة", key: "invoiceNumber", width: 16 },
      { header: "التاريخ", key: "date", width: 18 },
      { header: "العميل", key: "customer", width: 20 },
      { header: "الحالة", key: "status", width: 16 },
      { header: "الخزينة", key: "safe", width: 20 },
      { header: "الأصناف", key: "items", width: 35 },
      { header: "التكلفة المباشرة", key: "directCost", width: 18 },
      { header: "الإجمالي", key: "total", width: 18 },
    ];
    styleHeaderRow(salesSheet);
    salesInvoices.forEach((inv) => {
      salesSheet.addRow({
        invoiceNumber: `#S-${inv.id.slice(-5).toUpperCase()}`,
        date: formatDate(inv.createdAt),
        customer: inv.customerName ?? "—",
        status: inv.paymentStatus === "PAID" ? "مدفوع" : "تحت التحصيل",
        safe: inv.safe?.name ?? "—",
        items: formatInvoiceItemsSummary(inv.items),
        directCost: inv.directCost.toNumber(),
        total: inv.totalRevenue.toNumber(),
      });
    });

    // 3. Purchases
    const purchasesSheet = createRtlSheet(workbook, "المشتريات");
    purchasesSheet.columns = [
      { header: "رقم الفاتورة", key: "invoiceNumber", width: 16 },
      { header: "التاريخ", key: "date", width: 18 },
      { header: "المورد", key: "supplier", width: 22 },
      { header: "الخزينة", key: "safe", width: 20 },
      { header: "الأصناف", key: "items", width: 35 },
      { header: "الإجمالي", key: "total", width: 18 },
    ];
    styleHeaderRow(purchasesSheet);
    purchaseInvoices.forEach((inv) => {
      purchasesSheet.addRow({
        invoiceNumber: `#P-${inv.id.slice(-5).toUpperCase()}`,
        date: formatDate(inv.createdAt),
        supplier: inv.supplierName ?? "مورد مباشر",
        safe: inv.safe.name,
        items: formatInvoiceItemsSummary(inv.items),
        total: inv.totalAmount.toNumber(),
      });
    });

    // 4. Inventory
    const inventorySheet = createRtlSheet(workbook, "المخزون");
    inventorySheet.columns = [
      { header: "المنتج", key: "name", width: 28 },
      { header: "الكمية المتوفرة", key: "qty", width: 16 },
      { header: "متوسط التكلفة", key: "avgCost", width: 18 },
      { header: "سعر البيع", key: "sellingPrice", width: 18 },
      { header: "إجمالي التكلفة", key: "valuation", width: 20 },
    ];
    styleHeaderRow(inventorySheet);
    products.forEach((p) => {
      const avg = p.averageCostPrice.toNumber();
      inventorySheet.addRow({
        name: p.name,
        qty: p.stockQuantity,
        avgCost: avg,
        sellingPrice: p.sellingPrice.toNumber(),
        valuation: avg * p.stockQuantity,
      });
    });

    // 5. Expenses
    const expensesSheet = createRtlSheet(workbook, "المصروفات العامة");
    expensesSheet.columns = [
      { header: "التاريخ", key: "date", width: 18 },
      { header: "التصنيف", key: "category", width: 18 },
      { header: "الوصف", key: "description", width: 32 },
      { header: "الخزينة", key: "safe", width: 20 },
      { header: "المبلغ", key: "amount", width: 16 },
    ];
    styleHeaderRow(expensesSheet);
    expenses.forEach((exp) => {
      expensesSheet.addRow({
        date: formatDate(exp.createdAt),
        category: exp.category,
        description: exp.description ?? "—",
        safe: exp.safe.name,
        amount: exp.amount.toNumber(),
      });
    });

    // 6. Withdrawals
    const withdrawalsSheet = createRtlSheet(workbook, "المسحوبات الشخصية");
    withdrawalsSheet.columns = [
      { header: "التاريخ", key: "date", width: 18 },
      { header: "البيان", key: "notes", width: 34 },
      { header: "الخزينة", key: "safe", width: 20 },
      { header: "المبلغ", key: "amount", width: 16 },
    ];
    styleHeaderRow(withdrawalsSheet);
    withdrawals.forEach((w) => {
      withdrawalsSheet.addRow({
        date: formatDate(w.createdAt),
        notes: w.notes ?? "مسحوبات شخصية",
        safe: w.safe.name,
        amount: w.amount.toNumber(),
      });
    });

    // 7. Safes & Assets
    const safesSheet = createRtlSheet(workbook, "الخزائن والأصول");
    safesSheet.columns = [
      { header: "النوع", key: "kind", width: 16 },
      { header: "الاسم", key: "name", width: 28 },
      { header: "القيمة / الرصيد", key: "amount", width: 20 },
      { header: "ملاحظات / التاريخ", key: "info", width: 24 },
    ];
    styleHeaderRow(safesSheet);
    safes.forEach((s) => {
      safesSheet.addRow({
        kind: "خزينة",
        name: s.name,
        amount: s.balance.toNumber(),
        info: s.isDefault ? "افتراضية" : "إضافية",
      });
    });
    fixedAssets.forEach((a) => {
      safesSheet.addRow({
        kind: "أصل ثابت",
        name: a.name,
        amount: a.purchaseValue.toNumber(),
        info: formatDate(a.purchaseDate),
      });
    });

    // 8. Audit Logs
    const auditSheet = createRtlSheet(workbook, "سجل الحركات");
    auditSheet.columns = [
      { header: "التاريخ", key: "date", width: 20 },
      { header: "نوع الحركة", key: "action", width: 22 },
      { header: "البيان", key: "summary", width: 45 },
      { header: "المبلغ", key: "amount", width: 18 },
    ];
    styleHeaderRow(auditSheet);
    auditLogs.forEach((log) => {
      auditSheet.addRow({
        date: formatDate(log.createdAt),
        action: log.actionType,
        summary: log.summary,
        amount: log.amount.toNumber(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="mezan-accounting-export.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/export error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تجهيز ملف Excel" },
      { status: 500 }
    );
  }
}
