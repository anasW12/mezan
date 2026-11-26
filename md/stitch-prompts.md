# 🧩 Google Stitch UI Prompts

> **Purpose:** 6 self-contained, copy-paste-ready English prompts for **Google Stitch** to generate each screen of the Cloud Accounting & Inventory SaaS while preserving a single, consistent visual identity from `design.md`.
> **How to use:** Copy the entire text inside any prompt block below and paste it directly into Google Stitch.

---

## Prompt 1: Main Dashboard (`/dashboard`)
> **Covers:** Visual Identity (Sections 2, 3, 4, 5, 6, 19) + Dashboard Page Design (Section 7)

```text
Design a calm, modern, professional Arabic-first (RTL) B2B Cloud Accounting & Inventory SaaS web application screen in desktop view (1440px wide): the Main Dashboard ("لوحة التحكم").

[FIXED VISUAL IDENTITY & SHELL]
- Direction & Language: Full Arabic RTL layout (dir="rtl", lang="ar"). All reading flows, navigation, and progress move right-to-left.
- Color Palette: Calm finance-grade slate & emerald theme. Page background: #f8fafc (slate-50). Elevated card/sidebar/header surface: #ffffff (white). Primary accent: #059669 (emerald-600), hover #047857 (emerald-700), soft tint #ecfdf5 (emerald-50). Borders: #e2e8f0 (slate-200) and #f1f5f9 (slate-100). Text primary: #0f172a (slate-900), secondary: #475569 (slate-600), muted: #94a3b8 (slate-400). Semantic colors: positive #10b981, negative #f43f5e, warning #f59e0b, info #0ea5e9.
- Typography: Use "IBM Plex Sans Arabic" font across the entire UI. Use tabular-nums for all financial figures and quantities. Display KPI numbers: 30px/24px bold; Page title: 24px bold; Section headers: 20px semibold; Card titles: 18px semibold; Body: 16px/14px regular; Captions & badges: 12px medium.
- Spacing, Radius & Shadows: 24px page and card padding, 24px grid gaps, 32px section spacing. Cards: 12px border-radius (rounded-xl) with subtle shadow-sm and 1px #f1f5f9 border. Buttons: 8px radius (rounded-lg). Inputs: 6px radius (rounded-md). Badges/avatars: pill-shaped (rounded-full).
- Currency & Number Formatting: Egyptian Pound (ar-EG) formatted with 2 decimal places and "ج.م" placed AFTER the number (e.g., "٤٥,٠٠٠.٠٠ ج.م" or "45,000.00 ج.م"). Positive amounts use "+" prefix in #10b981; negative amounts use "-" prefix in #f43f5e.
- App Shell (Sidebar + Header):
  - Fixed Right Sidebar (256px wide, white background, left border #e2e8f0): Top 64px logo area with bottom border #f1f5f9. Vertical navigation list with 20px Lucide icons to the right of Arabic labels: "لوحة التحكم" (active state: #ecfdf5 bg, #047857 text, rounded-lg), "المخزن", "المشتريات", "المبيعات", "المصروفات", "المسحوبات", "سجل الحركات". Pin "الإعدادات" to the bottom separated by a subtle top border.
  - Sticky Top Header (64px tall, white background, bottom border #e2e8f0): Page title "لوحة التحكم" on the right, user menu on the left (32px circular avatar + "أحمد" + dropdown chevron + notification bell).

[SCREEN-SPECIFIC DESIGN: MAIN DASHBOARD]
Structure the main scrollable content area vertically with 32px spacing between sections:
1. Top Hero — 5 Primary KPI Cards (5-column responsive grid, 16px–24px gap):
   Each card has a white surface, rounded-xl, shadow-sm, 24px padding, a 40x40px rounded-lg tinted icon badge at the top, muted 14px Arabic label below, and bold 24px tabular-nums EGP value:
   - Card 1: "الكاش في الخزينة" — "٤٥,٠٠٠.٠٠ ج.م" — Emerald icon badge (#ecfdf5 bg, #059669 Vault icon).
   - Card 2: "قيمة البضاعة في المخزن" — "١٢٣,٠٠٠.٠٠ ج.م" — Blue icon badge (#eff6ff bg, #2563eb Package icon).
   - Card 3: "الأصول الثابتة" — "٥٠,٠٠٠.٠٠ ج.م" — Violet icon badge (#f5f3ff bg, #7c3aed Building2 icon).
   - Card 4: "المصروفات العامة" — "٨,٥٠٠.٠٠ ج.م" — Rose icon badge (#fff1f2 bg, #e11d48 Receipt icon).
   - Card 5: "صافي ربح الفترة" — "٢٨,٥٠٠.٠٠ ج.م" — Amber icon badge (#fffbeb bg, #d97706 TrendingUp icon).
2. Compact Secondary Strip:
   A calm horizontal strip below the KPI cards (slate-50/white subtle surface, rounded-xl, border #f1f5f9, 16px vertical / 24px horizontal padding) displaying two secondary metrics side by side:
   - "فلوس تحت التحصيل: ٤,٥٠٠.٠٠ ج.م" (with Clock icon)
   - "المسحوبات الشخصية: ٢,٠٠٠.٠٠ ج.م" (with UserMinus icon)
3. AI Smart Entry Bar (Text/Voice Input + Confirm-Before-Execute Preview Card):
   - Top Input Bar: White rounded-xl container, border #e2e8f0, shadow-sm, 8px inner padding. Right side has a Sparkles AI icon (#94a3b8), center has a clean borderless input with placeholder "اكتب أو سجّل عملية بالعربي... (مثال: اشتريت ١٠٠ تيشيرت بسعر ٤٥ جنيه)", plus a subtle Microphone icon button for voice entry and an emerald-600 "إرسال" send button on the left.
   - Below the bar, show the expanded Preview & Confirm Card ("معاينة العملية"): Soft emerald-tinted surface (#ecfdf5 at 50% opacity), 1px #a7f3d0 border, rounded-xl, 24px padding. Header: "معاينة العملية" with receipt icon and type label "النوع: فاتورة شراء". Compact preview table showing columns (المنتج | الكمية | سعر الوحدة | الإجمالي) with row ("تيشيرت | ١٠٠ | ٤٥.٠٠ | ٤,٥٠٠.٠٠"). Bold summary line "الإجمالي: ٤,٥٠٠.٠٠ ج.م" above two action buttons: primary emerald-600 "تأكيد وحفظ" and secondary white-bordered "إلغاء".
4. Recent 10 Transactions Table ("آخر ١٠ حركات"):
   White rounded-xl card, shadow-sm, border #f1f5f9. Header bar "آخر ١٠ حركات" (18px semibold). Clean table with columns: الوقت, النوع, الوصف, المبلغ. Show sample rows with pill-shaped type badges ("بيع" emerald-50/700, "شراء" blue-50/700, "مصروف" rose-50/700, "مسحوبات" slate-100/600, "تحصيل" sky-50/700) and color-coded tabular-nums amounts ("+١,٥٠٠.٠٠ ج.م" in emerald-600, "-٤,٥٠٠.٠٠ ج.م" in rose-600).
```

---

## Prompt 2: Onboarding Wizard (`/onboarding`)
> **Covers:** Visual Identity (Sections 2, 3, 4, 5, 6, 19) + Onboarding Wizard & Form Design (Sections 10 & 9)

```text
Design a calm, modern, distraction-free Arabic-first (RTL) 3-step Onboarding Wizard screen in desktop view (1440px wide): "/onboarding".

[FIXED VISUAL IDENTITY]
- Direction & Language: Full Arabic RTL layout (dir="rtl", lang="ar"). All reading flows and progress steps move right-to-left (Step 1 on the right, Step 3 on the left).
- Color Palette: Soft gradient page background from #f8fafc (slate-50) to #ffffff (white). Card surface: #ffffff (white). Primary accent: #059669 (emerald-600), hover #047857 (emerald-700), soft tint #ecfdf5 (emerald-50). Borders: #e2e8f0 (slate-200) and #cbd5e1 (slate-300). Text primary: #0f172a (slate-900), secondary: #475569 (slate-600), muted: #94a3b8 (slate-400). Error accent: #f43f5e (rose-500).
- Typography: Use "IBM Plex Sans Arabic" font. Use tabular-nums for all financial inputs and currency labels. Card title: 24px bold; Form labels: 14px medium; Inputs: 14px regular; Helper/Step labels: 12px medium.
- Spacing, Radius & Shadows: Centered single-column layout (max-w-lg / 512px max width). Wizard card: 16px border-radius (rounded-2xl), shadow-lg, 32px–40px padding. Inputs: 6px radius (rounded-md), 40px height. Buttons: 8px radius (rounded-lg). Form field spacing: 16px vertical gap.
- Currency & Number Formatting: Egyptian Pound currency suffix "ج.م" inside numeric inputs on the left side, with tabular-nums formatting (e.g., "0.00 ج.م").
- Shell Context: No app sidebar on this setup screen — keep the layout centered and focused, inheriting the exact same brand logo, emerald/slate palette, and Arabic typography as the main application shell.

[SCREEN-SPECIFIC DESIGN: 3-STEP ONBOARDING WIZARD]
1. Top Brand & RTL Step Indicator:
   - Centered brand logo at the top.
   - Horizontal 3-step progress bar flowing right-to-left:
     - "الخطوة ١: بيانات الشركة" (right — active emerald-600 dot, emerald-600 medium label)
     - Connecting line (slate-200)
     - "الخطوة ٢: الأصول الثابتة" (center — inactive slate-300 dot, muted label)
     - Connecting line (slate-200)
     - "الخطوة ٣: المنتجات الأولية" (left — inactive slate-300 dot, muted label)
2. Main Centered Wizard Card (Step 1 Active View):
   - Heading: "أهلاً بيك! خلينا نجهز حسابك 👋" (24px bold slate-900).
   - Subtle subtitle explaining quick setup in 3 steps.
   - Field 1: Label "اسم الشركة *" (rose-500 asterisk) + text input with placeholder "مثال: شركة النور للتجارة", showing clean emerald focus ring styling.
   - Field 2: Label "رصيد الخزينة الافتتاحي" + numeric input with tabular-nums placeholder "0.00" and "ج.م" suffix tag aligned on the left inside the input box.
   - Primary CTA Button: Full-width or right-aligned emerald-600 button "التالي ←" (with arrow pointing left for RTL progression).
3. Visual Preview / Sub-panel of Steps 2 & 3 Controls (to showcase full wizard consistency):
   - Also illustrate how Step 2 ("الأصول الثابتة - اختياري") and Step 3 ("المنتجات الأولية - اختياري") appear with repeatable item rows (Asset Name + Purchase Value in ج.م; Product Name + Quantity + Cost Price + Selling Price in ج.م), a "+ إضافة عنصر آخر" link button, a primary "حفظ والبدء" / "التالي ←" button, and a quiet "تخطي هذه الخطوة" (Skip) text link below the primary button.
```

---

## Prompt 3: Sales & Collection Screen (`/sales` & `/sales/new`)
> **Covers:** Visual Identity (Sections 2, 3, 4, 5, 6, 19) + Data Pages & Forms (Sections 8 & 9)

```text
Design a calm, modern, professional Arabic-first (RTL) B2B SaaS screen in desktop view (1440px wide): the Sales & COD Collection Management Screen ("المبيعات والتحصيل").

[FIXED VISUAL IDENTITY & SHELL]
- Direction & Language: Full Arabic RTL layout (dir="rtl", lang="ar").
- Color Palette: Page background: #f8fafc (slate-50). Surface: #ffffff (white). Primary: #059669 (emerald-600), hover #047857, soft #ecfdf5. Borders: #e2e8f0 (slate-200) and #f1f5f9 (slate-100). Text primary: #0f172a, secondary: #475569, muted: #94a3b8. Semantic badges: Paid (#ecfdf5 bg / #047857 text), Pending Collection (#fffbeb bg / #b45309 text), Negative/Delete (#f43f5e).
- Typography: "IBM Plex Sans Arabic" font with tabular-nums for all invoice numbers, quantities, and currency amounts. Page title: 24px bold; Table headers: 12px semibold; Cells & labels: 14px.
- Spacing, Radius & Shadows: 24px page padding, 24px gaps, 32px section spacing. Cards/Tables: rounded-xl, shadow-sm, 1px #f1f5f9 border. Buttons: rounded-lg. Inputs: rounded-md, 40px height. Badges: rounded-full.
- Currency & Number Formatting: Egyptian Pound formatted as "١,٥٠٠.٠٠ ج.م" (ar-EG, 2 decimals, "ج.م" after number, tabular-nums).
- App Shell (Sidebar + Header):
  - Fixed Right Sidebar (256px, white, left border #e2e8f0): Logo at top; nav items with Lucide icons: "لوحة التحكم", "المخزن", "المشتريات", "المبيعات" (active: #ecfdf5 bg, #047857 text), "المصروفات", "المسحوبات", "سجل الحركات", and bottom "الإعدادات".
  - Sticky Top Header (64px, white, bottom border #e2e8f0): Title "المبيعات" on the right, user menu on the left.

[SCREEN-SPECIFIC DESIGN: SALES LIST + NEW SALE DRAWER/FORM]
1. Page Header:
   - Right: "المبيعات" (24px bold slate-900).
   - Left: Primary emerald-600 CTA button "+ فاتورة بيع جديدة" with Plus icon.
2. Sales DataTable Card:
   - Top Toolbar (12px/16px padding, border-b #f1f5f9): Search input on the right ("🔍 بحث برقم الفاتورة أو المنتج...") with bg-slate-50, and status filter dropdown on the left ("الكل | مدفوع | تحت التحصيل").
   - Clean DataTable with columns: رقم الفاتورة, التاريخ, المنتجات, التكلفة المباشرة (شحن/تغليف), الإجمالي, الحالة, الإجراءات.
   - Sample Rows:
     - Row 1: "#1042 | ٢٦ نوفمبر | ٢× تيشيرت قطن | ٥٠.٠٠ ج.م | ٣٥٠.٠٠ ج.م | Badge: مدفوع (emerald pill) | عرض"
     - Row 2: "#1041 | ٢٥ نوفمبر | ١× بنطلون جينز | ٤٠.٠٠ ج.م | ٣٩٠.٠٠ ج.م | Badge: تحت التحصيل (amber pill) | 1-click primary-soft button "تحصيل ✓" (Settle COD)"
     - Row 3: "#1040 | ٢٥ نوفمبر | ٣× حزام جلد | ٠.٠٠ ج.م | ٢٤٠.٠٠ ج.م | Badge: تحت التحصيل (amber pill) | 1-click button "تحصيل ✓""
   - Table Footer: Pagination bar ("عرض ١–١٠ من ٤٥ فاتورة" on the right, "◄ ١ ٢ ٣ ►" controls on the left).
3. New Sale Form Card / Slide-over Panel ("فاتورة بيع جديدة"):
   Show the clean form layout below or alongside as a dedicated panel:
   - Payment Status segmented toggle: "مدفوع (كاش للخزينة)" vs "تحت التحصيل (COD)".
   - Safe selector dropdown ("الخزينة الرئيسية" — shown/enabled when Paid).
   - Direct Cost input ("تكلفة مباشرة - شحن وتغليف") with "ج.م" suffix.
   - Dynamic Line Items section ("المنتجات"): Row headers (المنتج | الكمية | سعر البيع | الإجمالي) with 2 product rows, trash delete icon button (slate-400 hover rose-500) per row, and "+ إضافة منتج آخر" link button.
   - Summary divider line with bold "الإجمالي: ١,٢٥٠.٠٠ ج.م" and two buttons: emerald-600 "حفظ الفاتورة" and white-bordered "إلغاء".
```

---

## Prompt 4: Inventory & Purchases Screens (`/inventory` & `/purchases`)
> **Covers:** Visual Identity (Sections 2, 3, 4, 5, 6, 19) + Data Pages & Forms (Sections 8 & 9)

```text
Design a calm, modern, professional Arabic-first (RTL) B2B SaaS interface in desktop view (1440px wide) showcasing the Inventory ("المخزن") and Purchases ("المشتريات") workflow.

[FIXED VISUAL IDENTITY & SHELL]
- Direction & Language: Full Arabic RTL layout (dir="rtl", lang="ar").
- Color Palette: Page background: #f8fafc (slate-50). Surface: #ffffff (white). Primary: #059669 (emerald-600), hover #047857, soft #ecfdf5. Borders: #e2e8f0 (slate-200) and #f1f5f9 (slate-100). Text primary: #0f172a, secondary: #475569, muted: #94a3b8. Warning low-stock badge: #fffbeb bg / #b45309 text with amber AlertTriangle icon. Delete hover: #f43f5e (rose-500).
- Typography: "IBM Plex Sans Arabic" font with tabular-nums for stock counts and EGP prices. Page title: 24px bold; Section headers: 18px–20px semibold; Table headers: 12px semibold; Cells & labels: 14px.
- Spacing, Radius & Shadows: 24px page padding, 24px card gaps, 32px section spacing. Cards/Tables: rounded-xl, shadow-sm, 1px #f1f5f9 border. Buttons: rounded-lg. Inputs: rounded-md, 40px height.
- Currency & Number Formatting: Egyptian Pound formatted with 2 decimal places and "ج.م" after the number (e.g., "٤٥.٠٠ ج.م"). Stock quantities shown without currency (e.g., "١٥٠ قطعة").
- App Shell (Sidebar + Header):
  - Fixed Right Sidebar (256px, white, left border #e2e8f0): Logo at top; nav items with Lucide icons: "لوحة التحكم", "المخزن" (active: #ecfdf5 bg, #047857 text), "المشتريات", "المبيعات", "المصروفات", "المسحوبات", "سجل الحركات", and bottom "الإعدادات".
  - Sticky Top Header (64px, white, bottom border #e2e8f0): Title "المخزن والمشتريات" on the right, user menu on the left.

[SCREEN-SPECIFIC DESIGN: INVENTORY TABLE + NEW PURCHASE FORM]
1. Section A — Inventory Products Table ("المخزن"):
   - Header bar: Title "المخزن" (24px bold) on the right, primary emerald-600 button "+ إضافة منتج جديد" on the left.
   - DataTable Card:
     - Top search & filter bar: "🔍 ابحث باسم المنتج..." input + filter dropdown ("الكل | مخزون منخفض").
     - Columns: #, اسم المنتج, الكمية المتوفرة, متوسط سعر التكلفة, سعر البيع, إجراءات.
     - Rows:
       - "1 | تيشيرت قطن | Amber Low-Stock Badge: ⚠️ ٨ قطع (مخزون منخفض) | ٤٥.٠٠ ج.م | ١٥٠.٠٠ ج.م | Edit & Delete ghost icon buttons"
       - "2 | بنطلون جينز | ١٥٠ قطعة | ١٢٠.٠٠ ج.م | ٣٥٠.٠٠ ج.م | Edit & Delete ghost icon buttons"
       - "3 | حزام جلد | ٢٠٠ قطعة | ٢٥.٠٠ ج.م | ٨٠.٠٠ ج.م | Edit & Delete ghost icon buttons"
     - Pagination footer at bottom.
2. Section B — New Purchase Invoice Card ("فاتورة شراء جديدة" from /purchases/new):
   - Clean white rounded-xl card below (or split view) with heading "فاتورة شراء جديدة".
   - Top fields: "اسم المورد (اختياري)" text input + "الخزينة المدفوع منها" select dropdown ("الخزينة الرئيسية").
   - Divider "المنتجات" with repeatable multi-item rows:
     - Row 1: Product select ("تيشيرت قطن") | Quantity ("١٠٠") | Unit Cost ("٤٥.٠٠ ج.م") | Trash2 delete icon.
     - Row 2: Product select ("بنطلون جينز") | Quantity ("٥٠") | Unit Cost ("١٢٠.٠٠ ج.م") | Trash2 delete icon.
     - Link button: "+ إضافة منتج آخر" in emerald-600.
   - Footer: Horizontal divider, bold total "الإجمالي المخصوم من الخزينة: ١٠,٥٠٠.٠٠ ج.م", primary emerald-600 button "حفظ الفاتورة" and secondary white-bordered "إلغاء".
```

---

## Prompt 5: Expenses, Withdrawals & Audit Log Screens (`/expenses`, `/withdrawals`, `/audit-logs`)
> **Covers:** Visual Identity (Sections 2, 3, 4, 5, 6, 19) + Data Pages & Component Specs (Sections 8 & 14)

```text
Design a calm, modern, professional Arabic-first (RTL) B2B SaaS view in desktop mode (1440px wide) covering General Expenses ("المصروفات العامة"), Owner Withdrawals ("المسحوبات الشخصية"), and the Read-Only Audit Log ("سجل الحركات"), plus core UI feedback components.

[FIXED VISUAL IDENTITY & SHELL]
- Direction & Language: Full Arabic RTL layout (dir="rtl", lang="ar").
- Color Palette: Page background: #f8fafc (slate-50). Surface: #ffffff (white). Primary: #059669 (emerald-600). Borders: #e2e8f0 (slate-200) and #f1f5f9 (slate-100). Text primary: #0f172a, secondary: #475569, muted: #94a3b8. Negative/Expense: #f43f5e (rose-500) with soft #fff1f2.
- Typography: "IBM Plex Sans Arabic" font with tabular-nums for all monetary figures and timestamps.
- Spacing, Radius & Shadows: 24px page padding, 24px card gaps, 32px section spacing. Cards/Tables: rounded-xl, shadow-sm. Modals: rounded-2xl, shadow-xl. Buttons: rounded-lg. Inputs: rounded-md, 40px height.
- Currency & Number Formatting: Egyptian Pound formatted with 2 decimals and "ج.م" after the number (e.g., "-٣,٠٠٠.٠٠ ج.م").
- App Shell (Sidebar + Header):
  - Fixed Right Sidebar (256px, white, left border #e2e8f0): Logo at top; nav items: "لوحة التحكم", "المخزن", "المشتريات", "المبيعات", "المصروفات" (active), "المسحوبات", "سجل الحركات", and bottom "الإعدادات".
  - Sticky Top Header (64px, white, bottom border #e2e8f0): Title on the right, user menu on the left.

[SCREEN-SPECIFIC DESIGN: EXPENSES, WITHDRAWALS, AUDIT LOG & MODALS]
1. General Expenses & Quick-Add Bar ("المصروفات العامة"):
   - Page header: "المصروفات العامة" + "+ إضافة مصروف" button.
   - Inline Quick-Add card: Compact horizontal form with "وصف المصروف (مثال: إيجار المحل / إعلانات فيسبوك)", "المبلغ (ج.م)", "الخزينة" dropdown, and emerald-600 "إضافة" button.
   - Table showing Date, Description, Safe, Amount (in rose-600 with "-" prefix), and Delete icon.
2. Owner Withdrawals Section ("المسحوبات الشخصية"):
   - Clear informational note badge in slate-50: "المسحوبات الشخصية تُخصم من الخزينة ولا تؤثر على صافي ربح الشركة".
   - Clean table + compact form for recording owner cash draws ("وصف السحب", "المبلغ ج.م", "الخزينة").
3. Immutable Audit Log Table ("سجل الحركات"):
   - Read-only chronological archive (NO edit or delete action column).
   - Search & type-filter bar ("بيع | شراء | مصروف | مسحوبات | تحصيل").
   - Columns: التاريخ والوقت, نوع الحركة (colored pill badge), البيان (Arabic narrative summary, e.g., "تم بيع ١٠ تيشيرت بسعر ١,٥٠٠.٠٠ ج.م"), المبلغ (tabular-nums).
4. Overlay & Feedback Components (Section 14):
   - Confirm Delete Modal (centered over dimmed bg-black/50 backdrop): White rounded-2xl shadow-xl card (max-w-md), top centered 48px rose-50 circle with AlertTriangle icon, title "هل أنت متأكد؟", body "سيتم حذف هذا السجل نهائياً. هذا الإجراء لا يمكن التراجع عنه.", centered rose-600 "حذف" button + white-bordered "إلغاء" button.
   - Bottom-left Toast Notification (bottom-start in RTL): White rounded-lg shadow-lg card with 4px emerald-500 right/start border, CheckCircle icon, and text "تم حفظ العملية بنجاح".
```

---

## Prompt 6: Landing Page & Login/Register Screens (`/`, `/login`, `/register`)
> **Covers:** Visual Identity (Sections 2, 3, 4, 5, 6, 19) + Auth Pages & Landing Page (Sections 11 & 12)

```text
Design two cohesive, calm, modern Arabic-first (RTL) public screens in desktop view (1440px wide): (A) the SaaS Marketing Landing Page ("/") and (B) the Owner Authentication Card ("/login").

[FIXED VISUAL IDENTITY]
- Direction & Language: Full Arabic RTL layout (dir="rtl", lang="ar").
- Color Palette: Primary: #059669 (emerald-600), hover #047857 (emerald-700), soft tint #ecfdf5 (emerald-50). Surface: #ffffff (white). Background: soft gradients using #f8fafc (slate-50) and #ecfdf5 (emerald-50). Borders: #e2e8f0 (slate-200) and #f1f5f9 (slate-100). Text primary: #0f172a (slate-900), secondary: #475569 (slate-600), muted: #94a3b8 (slate-400).
- Typography: "IBM Plex Sans Arabic" font. Hero display title: 48px bold; Auth card title: 24px bold; Feature titles: 18px semibold; Body: 16px/18px regular; Trust captions: 14px.
- Spacing, Radius & Shadows: Generous whitespace, 24px grid gaps, 32px+ section spacing. Feature cards: rounded-xl, 1px #f1f5f9 border, hover shadow-md. Auth card: rounded-2xl, shadow-lg. CTA buttons: rounded-xl/rounded-lg with soft emerald shadow.
- Currency & Number Context: Arabic-first Egyptian market context ("ج.م" currency readiness, 14-day free trial).
- Shell Context: Public screens without the app sidebar, sharing the exact brand logo, emerald/slate palette, and IBM Plex Sans Arabic typography.

[SCREEN-SPECIFIC DESIGN: PART A — LANDING PAGE (/)]
1. Top RTL Navbar:
   - Right: Brand Logo. Left: Navigation links ("المميزات", "الأسعار") + subtle "تسجيل الدخول" link + primary emerald-600 "ابدأ مجاناً" button.
2. Hero Section (bg-gradient-to-b from-white to-emerald-50/30):
   - Centered bold headline: "حاسب شغلك بذكاء" (48px bold slate-900).
   - Centered subtitle (max-w-2xl): "نظام محاسبة ومخزون سحابي مصمم خصيصاً لتجار الأونلاين والمشاريع الصغيرة في مصر."
   - Prominent emerald-600 CTA button: "ابدأ تجربتك المجانية" (with shadow-lg shadow-emerald-600/25).
   - Quiet trust line below: "✓ ١٤ يوم مجاناً   ✓ بدون بطاقة ائتمان".
3. 3-Column Features Grid:
   Three equal white rounded-xl cards (24px padding, border #f1f5f9), each with a 48x48px rounded-xl emerald-50 icon box:
   - Card 1 (LayoutDashboard icon): "لوحة تحكم شاملة" — "تابع الكاش في الخزينة، قيمة البضاعة، وصافي ربحك الحقيقي لحظة بلحظة."
   - Card 2 (Sparkles icon): "مساعد ذكي بالعربي" — "سجّل المبيعات والمشتريات والمصروفات بجملة واحدة بالعربي مع معاينة قبل الحفظ."
   - Card 3 (Package icon): "إدارة المخزون" — "تتبع الكميات، متوسط سعر التكلفة، وتنبيهات انخفاض المخزون تلقائياً."
4. Clean Minimal Footer: "حقوق النشر © ٢٠٢٦ — جميع الحقوق محفوظة".

[SCREEN-SPECIFIC DESIGN: PART B — LOGIN / REGISTER SCREEN (/login)]
- Full-height centered layout on bg-gradient-to-br from-emerald-50 to-slate-50.
- Centered Logo above a white rounded-2xl shadow-lg card (max-w-md / 448px wide, 32px padding).
- Title: "تسجيل الدخول" (24px bold centered).
- Input 1: Label "البريد الإلكتروني" + input ("example@email.com", height 40px, rounded-md).
- Input 2: Label "كلمة المرور" + masked password input with Eye toggle icon on the left.
- Primary full-width emerald-600 button: "تسجيل الدخول".
- Horizontal divider with centered text "أو".
- Secondary white-bordered full-width button: "G  الدخول بحساب Google".
- Bottom centered link: "ما عندكش حساب؟ " + emerald-600 link "سجل دلوقتي".
```
