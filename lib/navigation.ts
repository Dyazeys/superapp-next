import {
  ArrowDownToLine,
  ArrowRightLeft,
  BellRing,
  BookOpenText,
  Boxes,
  Calculator,
  Camera,
  CalendarDays,
  ChartBar,
  CheckCheck,
  ClipboardList,
  Clock3,
  FileText,
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
  Presentation,
  Puzzle,
  ScanSearch,
  ScrollText,
  RadioTower,
  ReceiptText,
  Route,
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
import type { Permission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/rbac";

export type TopNavItem = {
  id: "erp" | "analytics" | "task" | "team";
  label: string;
  icon: ComponentType<ComponentPropsWithoutRef<"svg">>;
  disabled?: boolean;
};

export type ModuleNavItem = {
  label: string;
  href: string;
  icon: ComponentType<ComponentPropsWithoutRef<"svg">>;
  badge?: string;
  permission?: Permission;
  permissionAny?: Permission[];
  children?: ModuleNavItem[];
};

const MARKETING_MODULE_ITEM: ModuleNavItem = {
  label: "Marketing",
  href: "/marketing",
  icon: Megaphone,
  badge: "Workspace",
  permission: PERMISSIONS.MARKETING_WORKSPACE_VIEW,
  children: [
    { label: "Performa Produk", href: "/marketing/product-performance", icon: ScanSearch, permission: PERMISSIONS.MARKETING_PRODUCT_PERFORMANCE_VIEW },
    { label: "Traffic", href: "/marketing/traffic", icon: Globe, permission: PERMISSIONS.MARKETING_TRAFFIC_VIEW },
    { label: "Iklan MP", href: "/marketing/mp-ads", icon: ChartBar, permission: PERMISSIONS.MARKETING_MP_ADS_VIEW },
    { label: "Live Streaming", href: "/marketing/live-streaming", icon: MonitorPlay, permission: PERMISSIONS.MARKETING_LIVE_STREAMING_VIEW },
  ],
};

const CONTENT_MODULE_ITEM: ModuleNavItem = {
  label: "Konten",
  href: "/content",
  icon: PenSquare,
  badge: "Workspace",
  permission: PERMISSIONS.CONTENT_WORKSPACE_VIEW,
  children: [
    { label: "Tiktok", href: "/content/tiktok", icon: Tv, permission: PERMISSIONS.CONTENT_TIKTOK_VIEW },
    { label: "Instagram", href: "/content/instagram", icon: Camera, permission: PERMISSIONS.CONTENT_INSTAGRAM_VIEW },
  ],
};

const TASK_DASHBOARD_ITEM: ModuleNavItem = {
  label: "Overview",
  href: "/task",
  icon: LayoutDashboard,
  badge: "Guide",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

const TASK_MY_TASKS_ITEM: ModuleNavItem = {
  label: "Tugas Saya",
  href: "/task/tugas-saya",
  icon: ClipboardList,
  badge: "Task",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
  children: [
    {
      label: "To Do",
      href: "/task/tugas-saya/to-do",
      icon: ClipboardList,
      permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
    },
    {
      label: "KPI",
      href: "/task/tugas-saya/kpi",
      icon: Gauge,
      permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
    },
  ],
};

const TASK_ATTENDANCE_ITEM: ModuleNavItem = {
  label: "Absensi",
  href: "/task/absensi",
  icon: Clock3,
  badge: "Daily",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
  children: [
    {
      label: "Clock In / Out",
      href: "/task/absensi/clock-in-out",
      icon: Clock3,
      permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
    },
    {
      label: "Izin / Sakit",
      href: "/task/absensi/izin-sakit",
      icon: ReceiptText,
      permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
    },
  ],
};

const TASK_MY_CALENDAR_ITEM: ModuleNavItem = {
  label: "Kalender Saya",
  href: "/task/kalender-saya",
  icon: CalendarDays,
  badge: "Plan",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

const TASK_REMINDER_ITEM: ModuleNavItem = {
  label: "Reminder",
  href: "/task/reminder",
  icon: BellRing,
  badge: "Focus",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

const TEAM_DASHBOARD_ITEM: ModuleNavItem = {
  label: "Overview",
  href: "/team",
  icon: LayoutDashboard,
  badge: "Guide",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

const TEAM_MODULE_ITEM: ModuleNavItem = {
  label: "Team Admin",
  href: "/team/users",
  icon: ShieldCheck,
  badge: "Security",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
  children: [
    { label: "Users", href: "/team/users", icon: UserRound, permission: PERMISSIONS.AUTH_USER_VIEW },
    { label: "Roles & Permissions", href: "/team/roles", icon: ShieldCheck, permission: PERMISSIONS.AUTH_ROLE_VIEW },
  ],
};

const TEAM_MEETING_ITEM: ModuleNavItem = {
  label: "Meeting",
  href: "/team/meeting",
  icon: Presentation,
  badge: "Sync",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
  children: [
    {
      label: "Notulen",
      href: "/team/meeting/notulen",
      icon: BookOpenText,
      permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
    },
    {
      label: "To Do",
      href: "/team/meeting/to-do",
      icon: ClipboardList,
      permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
    },
  ],
};

const TEAM_CALENDAR_ITEM: ModuleNavItem = {
  label: "Kalender Tim",
  href: "/team/kalender-tim",
  icon: CalendarDays,
  badge: "Plan",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

const TEAM_ANNOUNCEMENTS_ITEM: ModuleNavItem = {
  label: "Pengumuman",
  href: "/team/pengumuman",
  icon: Megaphone,
  badge: "Info",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

const TEAM_APPROVAL_ITEM: ModuleNavItem = {
  label: "Approval",
  href: "/team/approval",
  icon: CheckCheck,
  badge: "Flow",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

const TEAM_STRUCTURE_ITEM: ModuleNavItem = {
  label: "Struktur Tim",
  href: "/team/struktur-tim",
  icon: Route,
  badge: "Org",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

const TEAM_SOP_ITEM: ModuleNavItem = {
  label: "SOP",
  href: "/team/sop",
  icon: FileText,
  badge: "Guide",
  permissionAny: [PERMISSIONS.AUTH_USER_VIEW, PERMISSIONS.AUTH_ROLE_VIEW],
};

export const TOP_NAV_ITEMS: TopNavItem[] = [
  { id: "erp", label: "ERP", icon: LayoutGrid },
  { id: "analytics", label: "Analytic", icon: ChartBar },
  { id: "task", label: "Task", icon: ClipboardList },
  { id: "team", label: "Team", icon: ShieldCheck },
];

export const ERP_MODULE_ITEMS: ModuleNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, badge: "Transaksi", permission: PERMISSIONS.DASHBOARD_VIEW },
  {
    label: "Sales",
    href: "/sales",
    icon: HandCoins,
    badge: "Transaksi",
    permission: PERMISSIONS.SALES_ORDER_VIEW,
    children: [
      { label: "Sales Orders", href: "/sales/orders", icon: ClipboardList, permission: PERMISSIONS.SALES_ORDER_VIEW },
      { label: "Customers", href: "/sales/customers", icon: UserRound, permission: PERMISSIONS.SALES_CUSTOMER_VIEW },
    ],
  },
  {
    label: "Warehouse",
    href: "/warehouse",
    icon: Warehouse,
    badge: "Transaksi",
    permission: PERMISSIONS.WAREHOUSE_INBOUND_VIEW,
    children: [
      { label: "Vendors", href: "/warehouse/vendors", icon: Handshake, permission: PERMISSIONS.WAREHOUSE_VENDOR_VIEW },
      { label: "Purchase Orders", href: "/warehouse/purchase-orders", icon: ListOrdered, permission: PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_VIEW },
      { label: "Inbound", href: "/warehouse/inbound", icon: ArrowDownToLine, permission: PERMISSIONS.WAREHOUSE_INBOUND_VIEW },
      { label: "Adjustments", href: "/warehouse/adjustments", icon: SlidersHorizontal, permission: PERMISSIONS.WAREHOUSE_ADJUSTMENT_VIEW },
      { label: "Stock Balances", href: "/warehouse/stock-balances", icon: Scale, permission: PERMISSIONS.WAREHOUSE_STOCK_VIEW },
      { label: "Stock Movements", href: "/warehouse/stock-movements", icon: ArrowRightLeft, permission: PERMISSIONS.WAREHOUSE_STOCK_VIEW },
    ],
  },
  {
    label: "Accounting",
    href: "/accounting",
    icon: Calculator,
    badge: "Transaksi",
    permission: PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW,
    children: [
      { label: "Accounts", href: "/accounting/accounts", icon: Landmark, permission: PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW },
      { label: "Journals", href: "/accounting/journals", icon: BookOpenText, permission: PERMISSIONS.ACCOUNTING_JOURNAL_VIEW },
      { label: "Opex", href: "/accounting/operational-expenses", icon: ReceiptText, permission: PERMISSIONS.ACCOUNTING_OPEX_VIEW },
    ],
  },
  {
    label: "Payout",
    href: "/payout",
    icon: HandCoins,
    badge: "Transaksi",
    permission: PERMISSIONS.PAYOUT_RECORD_VIEW,
    children: [
      { label: "Overview", href: "/payout", icon: LayoutDashboard, permission: PERMISSIONS.PAYOUT_RECORD_VIEW },
      { label: "Records", href: "/payout/records", icon: ClipboardList, permission: PERMISSIONS.PAYOUT_RECORD_VIEW },
      { label: "Adjustments", href: "/payout/adjustments", icon: SlidersHorizontal, permission: PERMISSIONS.PAYOUT_ADJUSTMENT_VIEW },
      { label: "Transfers", href: "/payout/transfers", icon: ArrowRightLeft, permission: PERMISSIONS.PAYOUT_TRANSFER_VIEW },
      { label: "Reconciliation", href: "/payout/reconciliation", icon: Scale, permission: PERMISSIONS.PAYOUT_RECONCILIATION_VIEW },
    ],
  },
  {
    label: "Product",
    href: "/products",
    icon: Boxes,
    badge: "Master",
    permission: PERMISSIONS.PRODUCT_MASTER_VIEW,
    children: [
      { label: "Product Categories", href: "/products/categories", icon: Tags, permission: PERMISSIONS.PRODUCT_CATEGORY_VIEW },
      { label: "Master Inventory", href: "/products/inventory", icon: Boxes, permission: PERMISSIONS.PRODUCT_INVENTORY_VIEW },
      { label: "Master Products", href: "/products/master", icon: PackageSearch, permission: PERMISSIONS.PRODUCT_MASTER_VIEW },
      { label: "Product BOM", href: "/products/bom", icon: Puzzle, permission: PERMISSIONS.PRODUCT_BOM_VIEW },
    ],
  },
  {
    label: "Channel",
    href: "/channel",
    icon: RadioTower,
    badge: "Master",
    permission: PERMISSIONS.CHANNEL_MASTER_VIEW,
    children: [
      { label: "Channel Groups", href: "/channel/groups", icon: Users, permission: PERMISSIONS.CHANNEL_GROUP_VIEW },
      { label: "Channel Categories", href: "/channel/categories", icon: FolderTree, permission: PERMISSIONS.CHANNEL_CATEGORY_VIEW },
      { label: "Channels", href: "/channel/channels", icon: RadioTower, permission: PERMISSIONS.CHANNEL_MASTER_VIEW },
    ],
  },
  MARKETING_MODULE_ITEM,
  CONTENT_MODULE_ITEM,
  { label: "Workspace", href: "/workspace", icon: PanelLeft, badge: "UI", permission: PERMISSIONS.AUTH_ROLE_VIEW },
];

export const ANALYTICS_MODULE_ITEMS: ModuleNavItem[] = [
  {
    label: "Overview",
    href: "/analytics",
    icon: LayoutDashboard,
    badge: "Guide",
    permissionAny: [
      PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
      PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
      PERMISSIONS.MARKETING_WORKSPACE_VIEW,
      PERMISSIONS.CONTENT_WORKSPACE_VIEW,
    ],
  },
  {
    label: "Financial",
    href: "/analytics/financial",
    icon: ChartBar,
    badge: "Finance",
    permissionAny: [
      PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
      PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
    ],
    children: [
      {
        label: "Report PNL",
        href: "/dashboard/report-pnl",
        icon: ScrollText,
        permission: PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
      },
      {
        label: "Budget Meters",
        href: "/dashboard/budget-meters",
        icon: Gauge,
        permission: PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
      },
    ],
  },
  MARKETING_MODULE_ITEM,
  CONTENT_MODULE_ITEM,
];

export const TASK_MODULE_ITEMS: ModuleNavItem[] = [
  TASK_DASHBOARD_ITEM,
  TASK_MY_TASKS_ITEM,
  TASK_ATTENDANCE_ITEM,
  TASK_MY_CALENDAR_ITEM,
  TASK_REMINDER_ITEM,
];

export const TEAM_MODULE_ITEMS: ModuleNavItem[] = [
  TEAM_DASHBOARD_ITEM,
  TEAM_MEETING_ITEM,
  TEAM_CALENDAR_ITEM,
  TEAM_ANNOUNCEMENTS_ITEM,
  TEAM_APPROVAL_ITEM,
  TEAM_STRUCTURE_ITEM,
  TEAM_SOP_ITEM,
  TEAM_MODULE_ITEM,
];
