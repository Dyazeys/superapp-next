import {
  Bot,
  ChartBar,
  Landmark,
  LayoutGrid,
  PanelLeft,
  Package2,
  Upload,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
  Warehouse,
} from "lucide-react";
import type { ComponentPropsWithoutRef, ComponentType } from "react";

export type TopNavItem = {
  id: "erp" | "analytics" | "crm" | "team" | "assistant";
  label: string;
  icon: ComponentType<ComponentPropsWithoutRef<"svg">>;
  disabled?: boolean;
};

export type ModuleNavItem = {
  label: string;
  href: string;
  icon: ComponentType<ComponentPropsWithoutRef<"svg">>;
  badge?: string;
  children?: ModuleNavItem[];
};

export const TOP_NAV_ITEMS: TopNavItem[] = [
  { id: "erp", label: "ERP", icon: LayoutGrid },
  { id: "analytics", label: "Analytic", icon: ChartBar, disabled: true },
  { id: "crm", label: "CRM", icon: Users, disabled: true },
  { id: "team", label: "Team", icon: ShieldCheck, disabled: true },
  { id: "assistant", label: "AI Assistant", icon: Bot, disabled: true },
];

export const ERP_MODULE_ITEMS: ModuleNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Sparkles, badge: "Transaksi" },
  {
    label: "Sales",
    href: "/sales",
    icon: ReceiptText,
    badge: "Transaksi",
    children: [
      { label: "Sales Orders", href: "/sales/orders", icon: ReceiptText },
      { label: "Customers", href: "/sales/customers", icon: Users },
    ],
  },
  {
    label: "Warehouse",
    href: "/warehouse",
    icon: Warehouse,
    badge: "Transaksi",
    children: [
      { label: "Vendors", href: "/warehouse/vendors", icon: Warehouse },
      { label: "Purchase Orders", href: "/warehouse/purchase-orders", icon: Warehouse },
      { label: "Inbound", href: "/warehouse/inbound", icon: Warehouse },
      { label: "Adjustments", href: "/warehouse/adjustments", icon: Warehouse },
      { label: "Stock Balances", href: "/warehouse/stock-balances", icon: Warehouse },
      { label: "Stock Movements", href: "/warehouse/stock-movements", icon: Warehouse },
    ],
  },
  {
    label: "Accounting",
    href: "/accounting",
    icon: ShieldCheck,
    badge: "Transaksi",
    children: [
      { label: "Accounts", href: "/accounting/accounts", icon: ShieldCheck },
      { label: "Journals", href: "/accounting/journals", icon: ShieldCheck },
      { label: "Channel Report", href: "/accounting/channel-report", icon: ShieldCheck },
      { label: "Opex", href: "/accounting/operational-expenses", icon: ShieldCheck },
      { label: "Opex Barter", href: "/accounting/operational-expense-barter", icon: ShieldCheck },
    ],
  },
  {
    label: "Payout",
    href: "/payout",
    icon: Landmark,
    badge: "Transaksi",
    children: [
      { label: "Overview", href: "/payout", icon: Landmark },
      { label: "Records", href: "/payout/records", icon: Landmark },
      { label: "Adjustments", href: "/payout/adjustments", icon: Landmark },
      { label: "Transfers", href: "/payout/transfers", icon: Landmark },
      { label: "Reconciliation", href: "/payout/reconciliation", icon: Landmark },
    ],
  },
  {
    label: "Product",
    href: "/products",
    icon: Package2,
    badge: "Master",
    children: [
      { label: "Product Categories", href: "/products/categories", icon: Package2 },
      { label: "Master Inventory", href: "/products/inventory", icon: Package2 },
      { label: "Master Products", href: "/products/master", icon: Package2 },
      { label: "Product BOM", href: "/products/bom", icon: Package2 },
    ],
  },
  {
    label: "Channel",
    href: "/channel",
    icon: Users,
    badge: "Master",
    children: [
      { label: "Channel Groups", href: "/channel/groups", icon: Users },
      { label: "Channel Categories", href: "/channel/categories", icon: Users },
      { label: "Channels", href: "/channel/channels", icon: Users },
    ],
  },
  {
    label: "Master Import",
    href: "/master-data/import",
    icon: Upload,
    badge: "Master",
  },
  {
    label: "BOM TXT Import",
    href: "/master-data/import-txt",
    icon: Upload,
    badge: "Master",
  },
  { label: "Workspace", href: "/workspace", icon: PanelLeft, badge: "UI" },
];
