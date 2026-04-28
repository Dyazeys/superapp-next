import {
  ArrowDownToLine,
  ArrowRightLeft,
  Bot,
  BookOpenText,
  Boxes,
  Calculator,
  Camera,
  ChartBar,
  ClipboardList,
  FolderTree,
  Gauge,
  Globe,
  HandCoins,
  Handshake,
  Landmark,
  LayoutGrid,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  MonitorPlay,
  PackageSearch,
  PanelLeft,
  PenSquare,
  Puzzle,
  ScanSearch,
  ScrollText,
  RadioTower,
  ReceiptText,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Tv,
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

const MARKETING_MODULE_ITEM: ModuleNavItem = {
  label: "Marketing",
  href: "/marketing",
  icon: Megaphone,
  badge: "Workspace",
  children: [
    { label: "Performa Produk", href: "/marketing/product-performance", icon: ScanSearch },
    { label: "Traffic", href: "/marketing/traffic", icon: Globe },
    { label: "Iklan MP", href: "/marketing/mp-ads", icon: ChartBar },
    { label: "Live Streaming", href: "/marketing/live-streaming", icon: MonitorPlay },
  ],
};

const CONTENT_MODULE_ITEM: ModuleNavItem = {
  label: "Konten",
  href: "/content",
  icon: PenSquare,
  badge: "Workspace",
  children: [
    { label: "Tiktok", href: "/content/tiktok", icon: Tv },
    { label: "Instagram", href: "/content/instagram", icon: Camera },
  ],
};

export const TOP_NAV_ITEMS: TopNavItem[] = [
  { id: "erp", label: "ERP", icon: LayoutGrid },
  { id: "analytics", label: "Analytic", icon: ChartBar },
  { id: "crm", label: "CRM", icon: Users, disabled: true },
  { id: "team", label: "Team", icon: ShieldCheck, disabled: true },
  { id: "assistant", label: "AI Assistant", icon: Bot, disabled: true },
];

export const ERP_MODULE_ITEMS: ModuleNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: "Transaksi" },
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
  MARKETING_MODULE_ITEM,
  CONTENT_MODULE_ITEM,
  { label: "Workspace", href: "/workspace", icon: PanelLeft, badge: "UI" },
];

export const ANALYTICS_MODULE_ITEMS: ModuleNavItem[] = [
  {
    label: "Report PNL",
    href: "/dashboard/report-pnl",
    icon: ScrollText,
    badge: "Report",
  },
  {
    label: "Budget Meters",
    href: "/dashboard/budget-meters",
    icon: Gauge,
    badge: "Budget",
  },
  MARKETING_MODULE_ITEM,
  CONTENT_MODULE_ITEM,
];
