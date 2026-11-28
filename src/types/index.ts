export type PaymentStatus = "PAID" | "PENDING_COLLECTION";
export type TaxType = "PERCENTAGE" | "FIXED";
export type PlanStatus = "TRIAL" | "ACTIVE" | "EXPIRED";

export type TransactionActionType =
  | "SALE_CREATED"
  | "PURCHASE_CREATED"
  | "EXPENSE_CREATED"
  | "WITHDRAWAL_CREATED"
  | "SALE_COLLECTED"
  | "PRODUCT_ADDED"
  | "PRODUCT_UPDATED"
  | "SAFE_ADJUSTED"
  | "ASSET_ADDED";

export interface KpiSummary {
  cashbox: number;
  inventoryValue: number;
  fixedAssets: number;
  generalExpenses: number;
  netProfit: number;
  fundsUnderCollection: number;
  ownerWithdrawals: number;
}

export interface AuditLogEntry {
  id: string;
  actionType: TransactionActionType;
  summary: string;
  amount: number;
  isPositive: boolean;
  timeLabel: string;
  dateLabel: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  averageCostPrice: number;
  sellingPrice: number;
}

export interface SafeAccount {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
}

export interface FixedAssetRow {
  id: string;
  name: string;
  purchaseValue: number;
  purchaseDate: string;
}

export interface SalesInvoiceDetailItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalesInvoiceRow {
  id: string;
  invoiceNumber: string;
  date: string;
  invoiceDateInput: string;
  customerName?: string | null;
  safeName?: string | null;
  itemsSummary: string;
  items: SalesInvoiceDetailItem[];
  directCost: number;
  subtotal: number;
  taxType: TaxType;
  taxValue: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string | null;
}

export interface SalesInvoiceFormInitialData {
  id: string;
  invoiceNumber: string;
  paymentStatus: PaymentStatus;
  safeId: string | null;
  customerName: string;
  directCost: number;
  taxType: TaxType;
  taxValue: number;
  notes: string;
  invoiceDate: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PurchaseInvoiceRow {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierName: string;
  safeName: string;
  itemsSummary: string;
  totalAmount: number;
}

export interface PurchaseInvoiceFormInitialData {
  id: string;
  invoiceNumber: string;
  safeId: string;
  supplierName: string;
  notes: string;
  invoiceDate: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
  }>;
}

export interface ExpenseRow {
  id: string;
  date: string;
  category?: string;
  description: string;
  safeName: string;
  amount: number;
}

export interface WithdrawalRow {
  id: string;
  date: string;
  description: string;
  safeName: string;
  amount: number;
}

export interface CompanyTenantRow {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  planStatus: PlanStatus;
  createdAt: string;
}

export interface AIParseItem {
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  sellingPrice?: number;
  createIfMissing?: boolean;
}

export interface AIProductFields {
  name: string;
  stockQuantity: number;
  averageCostPrice: number;
  sellingPrice: number;
}

export interface AIParsePreview {
  action:
    | "PURCHASE"
    | "SALE"
    | "EXPENSE"
    | "WITHDRAWAL"
    | "ADD_PRODUCT"
    | "SAFE_DEPOSIT";
  actionLabel: string;
  paymentStatus?: PaymentStatus;
  safeId?: string | null;
  safeName: string;
  supplierName?: string | null;
  customerName?: string | null;
  directCost?: number;
  category?: string | null;
  items?: AIParseItem[];
  productFields?: AIProductFields;
  description?: string | null;
  totalAmount: number;
  arabicSummary: string;
}
