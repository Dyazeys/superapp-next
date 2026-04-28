import {
  ArrowDownToLine,
  ArrowRightLeft,
  Bot,
  BookOpenText,
  Boxes,
  Calculator,
  ChartBar,
  ClipboardList,
  FolderTree,
  HandCoins,
  Handshake,
  Landmark,
  LayoutGrid,
  LayoutDashboard,
  ListOrdered,
  PackageSearch,
  PanelLeft,
  Puzzle,
  ScrollText,
  RadioTower,
  ReceiptText,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  UserRound,
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
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: "Transaksi",
    children: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Report PNL", href: "/dashboard/report-pnl", icon: ScrollText },
    ],
  },
  {
    label: "Sales",
    href: "/sales",
    icon: HandCoins,
    badge: "Transaksi",
    children: [
      { label: "Sales Orders", href: "/sales/orders", icon: ClipboardList },
      { label: "Customers", href: "/sales/customers", icon: UserRound },
    ],
  },
  {
    label: "Warehouse",
    href: "/warehouse",
    icon: Warehouse,
    badge: "Transaksi",
    children: [
      { label: "Vendors", href: "/warehouse/vendors", icon: Handshake },
      { label: "Purchase Orders", href: "/warehouse/purchase-orders", icon: ListOrdered },
      { label: "Inbound", href: "/warehouse/inbound", icon: ArrowDownToLine },
      { label: "Adjustments", href: "/warehouse/adjustments", icon: SlidersHorizontal },
      { label: "Stock Balances", href: "/warehouse/stock-balances", icon: Scale },
      { label: "Stock Movements", href: "/warehouse/stock-movements", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Accounting",
    href: "/accounting",
    icon: Calculator,
    badge: "Transaksi",
    children: [
      { label: "Accounts", href: "/accounting/accounts", icon: Landmark },
      { label: "Journals", href: "/accounting/journals", icon: BookOpenText },
      { label: "Opex", href: "/accounting/operational-expenses", icon: ReceiptText },
    ],
  },
  {
    label: "Payout",
    href: "/payout",
    icon: HandCoins,
    badge: "Transaksi",
    children: [
      { label: "Overview", href: "/payout", icon: LayoutDashboard },
      { label: "Records", href: "/payout/records", icon: ClipboardList },
      { label: "Adjustments", href: "/payout/adjustments", icon: SlidersHorizontal },
      { label: "Transfers", href: "/payout/transfers", icon: ArrowRightLeft },
      { label: "Reconciliation", href: "/payout/reconciliation", icon: Scale },
    ],
  },
  {
    label: "Product",
    href: "/products",
    icon: Boxes,
    badge: "Master",
    children: [
      { label: "Product Categories", href: "/products/categories", icon: Tags },
      { label: "Master Inventory", href: "/products/inventory", icon: Boxes },
      { label: "Master Products", href: "/products/master", icon: PackageSearch },
      { label: "Product BOM", href: "/products/bom", icon: Puzzle },
    ],
  },
  {
    label: "Channel",
    href: "/channel",
    icon: RadioTower,
    badge: "Master",
    children: [
      { label: "Channel Groups", href: "/channel/groups", icon: Users },
      { label: "Channel Categories", href: "/channel/categories", icon: FolderTree },
      { label: "Channels", href: "/channel/channels", icon: RadioTower },
    ],
  },
  { label: "Workspace", href: "/workspace", icon: PanelLeft, badge: "UI" },
];
