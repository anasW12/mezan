import {
  Banknote,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShoppingCart,
  UserMinus,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    label: "لوحة التحكم",
    shortLabel: "لوحة",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "المخزن",
    shortLabel: "مخزن",
    href: "/inventory",
    icon: Package,
  },
  {
    label: "المشتريات",
    shortLabel: "شراء",
    href: "/purchases",
    icon: ShoppingCart,
  },
  {
    label: "المبيعات",
    shortLabel: "مبيعات",
    href: "/sales",
    icon: Banknote,
  },
  {
    label: "المصروفات",
    shortLabel: "مصروف",
    href: "/expenses",
    icon: Receipt,
  },
  {
    label: "المسحوبات",
    shortLabel: "مسحوب",
    href: "/withdrawals",
    icon: UserMinus,
  },
  {
    label: "سجل الحركات",
    shortLabel: "سجل",
    href: "/audit-logs",
    icon: ScrollText,
  },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  label: "الإعدادات",
  shortLabel: "إعدادات",
  href: "/settings",
  icon: Settings,
};

export const MOBILE_TAB_ITEMS: NavItem[] = [
  MAIN_NAV_ITEMS[0], // لوحة التحكم
  MAIN_NAV_ITEMS[1], // المخزن
  MAIN_NAV_ITEMS[3], // المبيعات
  MAIN_NAV_ITEMS[4], // المصروفات
  SETTINGS_NAV_ITEM, // الإعدادات
];

export const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/inventory": "المخزن",
  "/purchases": "المشتريات",
  "/purchases/new": "فاتورة شراء جديدة",
  "/sales": "المبيعات",
  "/sales/new": "فاتورة بيع جديدة",
  "/expenses": "المصروفات العامة",
  "/withdrawals": "المسحوبات الشخصية",
  "/audit-logs": "سجل الحركات",
  "/settings": "الإعدادات",
};
