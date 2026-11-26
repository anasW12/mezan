export class InsufficientBalanceError extends Error {
  constructor(message = "الرصيد المتاح في الخزينة غير كافٍ لإتمام العملية") {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export class InsufficientStockError extends Error {
  constructor(message = "الكمية المتاحة في المخزن غير كافية لإتمام العملية") {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export class UnauthorizedTenantError extends Error {
  constructor(message = "غير مصرح بالوصول إلى بيانات هذه الشركة") {
    super(message);
    this.name = "UnauthorizedTenantError";
  }
}
