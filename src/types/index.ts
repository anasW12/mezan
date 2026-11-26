export type PaymentStatus = "PAID" | "PENDING_COLLECTION";
export type PlanStatus = "TRIAL" | "ACTIVE" | "EXPIRED";

export type TransactionActionType =
  | "SALE_CREATED"
  | "PURCHASE_CREATED"
  | "EXPENSE_CREATED"
  | "WITHDRAWAL_CREATED"
  | "SALE_COLLECTED";

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

export interface SalesInvoiceRow {
  id: string;
  invoiceNumber: string;
  date: string;
  itemsSummary: string;
  directCost: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
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

export interface ExpenseRow {
  id: string;
  date: string;
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
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface AIParsePreview {
  action: "PURCHASE" | "SALE" | "EXPENSE" | "WITHDRAWAL";
  actionLabel: string;
  items?: AIParseItem[];
  description?: string;
  safeName: string;
  totalAmount: number;
  arabicSummary: string;
}
