import {
  ArrowDownToLine,
  ArrowRightLeft,
  Banknote,
  BarChart3,
  BookOpenText,
  Boxes,
  Calculator,
  CalendarDays,
  ChartBar,
  CheckCheck,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  FolderTree,
  Gauge,
  Music,
  Store,
  Upload,
  HandCoins,
  Handshake,
  Landmark,
  LayoutGrid,
  LayoutDashboard,
  ListChecks,
  ListOrdered,
  Megaphone,
  PackageSearch,
  PanelLeft,
  PenSquare,
  Presentation,
  Puzzle,
  ScrollText,
  RadioTower,
  ReceiptText,
  Route,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Undo2,
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
    { label: "Data Shopee", href: "/marketing/data-shopee", icon: Store, permission: PERMISSIONS.MARKETING_WORKSPACE_VIEW },
    { label: "Data TikTok", href: "/marketing/data-tiktok", icon: Music, permission: PERMISSIONS.MARKETING_WORKSPACE_VIEW },
    { label: "Product Performance", href: "/marketing/product-performance", icon: BarChart3, permission: PERMISSIONS.MARKETING_PRODUCT_PERFORMANCE_VIEW },
  ],
};

const CONTENT_MODULE_ITEM: ModuleNavItem = {
  label: "Konten",
  href: "/content",
  icon: PenSquare,
  badge: "Workspace",
  permission: PERMISSIONS.CONTENT_WORKSPACE_VIEW,
  children: [
    { label: "Daily Upload", href: "/content", icon: Upload, permission: PERMISSIONS.CONTENT_WORKSPACE_VIEW },
  ],
};

const TASK_DASHBOARD_ITEM: ModuleNavItem = {
  label: "Overview",
  href: "/task",
  icon: LayoutDashboard,
  badge: "Guide",
  permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
};

const TASK_MY_TASKS_ITEM: ModuleNavItem = {
  label: "Tugas Saya",
  href: "/task/tugas-saya",
  icon: ClipboardList,
  badge: "Task",
  permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
  children: [
    {
      label: "To Do",
      href: "/task/tugas-saya/to-do",
      icon: ClipboardList,
      permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
    },
    {
      label: "KPI",
      href: "/task/tugas-saya/kpi",
      icon: Gauge,
      permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
    },
    {
      label: "Rutinitas",
      href: "/task/tugas-saya/rutinitas",
      icon: ListChecks,
      permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
    },
  ],
};

const TASK_ATTENDANCE_ITEM: ModuleNavItem = {
  label: "Absensi",
  href: "/task/absensi",
  icon: Clock3,
  badge: "Daily",
  permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
  children: [
    {
      label: "Clock In / Out",
      href: "/task/absensi/clock-in-out",
      icon: Clock3,
      permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
    },
    {
      label: "Izin / Sakit",
      href: "/task/absensi/izin-sakit",
      icon: ReceiptText,
      permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
    },
  ],
};

const TASK_MY_CALENDAR_ITEM: ModuleNavItem = {
  label: "Kalender Saya",
  href: "/task/kalender-saya",
  icon: CalendarDays,
  badge: "Plan",
  permission: PERMISSIONS.TASK_WORKSPACE_VIEW,
};

const TEAM_DASHBOARD_ITEM: ModuleNavItem = {
  label: "Overview",
  href: "/team",
  icon: LayoutDashboard,
  badge: "Guide",
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
};

const TEAM_CALENDAR_ITEM: ModuleNavItem = {
  label: "Kalender Tim",
  href: "/team/kalender-tim",
  icon: CalendarDays,
  badge: "Plan",
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
};

const TEAM_ANNOUNCEMENTS_ITEM: ModuleNavItem = {
  label: "Pengumuman",
  href: "/team/pengumuman",
  icon: Megaphone,
  badge: "Info",
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
};

const TEAM_APPROVAL_ITEM: ModuleNavItem = {
  label: "Approval",
  href: "/team/approval",
  icon: CheckCheck,
  badge: "Flow",
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
  children: [
    {
      label: "Leader",
      href: "/team/approval/leader",
      icon: CheckCheck,
      permission: PERMISSIONS.TEAM_APPROVALS_LEADER_APPROVE,
    },
    {
      label: "Manager",
      href: "/team/approval/manager",
      icon: Eye,
      permission: PERMISSIONS.TEAM_APPROVALS_MANAGER_APPROVE,
    },
  ],
};

const TEAM_STRUCTURE_ITEM: ModuleNavItem = {
  label: "Struktur Tim",
  href: "/team/struktur-tim",
  icon: Route,
  badge: "Org",
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
};

const TEAM_SOP_ITEM: ModuleNavItem = {
  label: "SOP",
  href: "/team/sop",
  icon: FileText,
  badge: "Guide",
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
};

const TEAM_TODO_ITEM: ModuleNavItem = {
  label: "Kelola Tugas Tim",
  href: "/team/tugas-saya/to-do",
  icon: ClipboardList,
  badge: "Task",
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
};

const TEAM_KPI_ITEM: ModuleNavItem = {
  label: "KPI Tim",
  href: "/team/tugas-saya/kpi",
  icon: Gauge,
  badge: "Task",
  permission: PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
    icon: Store,
    badge: "Transaksi",
    permission: PERMISSIONS.SALES_ORDER_VIEW,
    children: [
      { label: "Sales Orders", href: "/sales/orders", icon: ClipboardList, permission: PERMISSIONS.SALES_ORDER_VIEW },
      { label: "Customers", href: "/sales/customers", icon: UserRound, permission: PERMISSIONS.SALES_CUSTOMER_VIEW },
      { label: "Channels", href: "/sales/channels", icon: LayoutGrid, permission: PERMISSIONS.SALES_ORDER_VIEW },
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
      { label: "Returns", href: "/warehouse/returns", icon: Undo2, permission: PERMISSIONS.WAREHOUSE_RETURN_VIEW },
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
      { label: "Mutasi BCA", href: "/accounting/bank-mutation", icon: ArrowRightLeft, permission: PERMISSIONS.ACCOUNTING_MUTATION_VIEW },
      { label: "Mutasi Kas", href: "/accounting/cash-mutation", icon: Banknote, permission: PERMISSIONS.ACCOUNTING_MUTATION_VIEW },
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
      PERMISSIONS.CONTENT_DAILY_REPORT_VIEW,
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
        href: "/analytics/financial/report-pnl",
        icon: ScrollText,
        permission: PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
      },
      {
        label: "Budget Meters",
        href: "/analytics/financial/budget-meters",
        icon: Gauge,
        permission: PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
      },
    ],
  },
  {
    label: "Marketing",
    href: "/analytics/marketing",
    icon: Megaphone,
    badge: "Visual",
    permissionAny: [
      PERMISSIONS.MARKETING_WORKSPACE_VIEW,
    ],
    children: [
      {
        label: "Shopee",
        href: "/analytics/marketing/shopee",
        icon: Store,
        permission: PERMISSIONS.MARKETING_WORKSPACE_VIEW,
      },
      {
        label: "TikTok",
        href: "/analytics/marketing/tiktok",
        icon: Music,
        permission: PERMISSIONS.MARKETING_WORKSPACE_VIEW,
      },
    ],
  },
  {
    label: "Content",
    href: "/analytics/content",
    icon: Upload,
    badge: "Visual",
    permissionAny: [
      PERMISSIONS.CONTENT_DAILY_REPORT_VIEW,
    ],
    children: [
      {
        label: "Daily Upload",
        href: "/analytics/content",
        icon: Upload,
        permission: PERMISSIONS.CONTENT_DAILY_REPORT_VIEW,
      },
    ],
  },
];

export const TASK_MODULE_ITEMS: ModuleNavItem[] = [
  TASK_DASHBOARD_ITEM,
  TASK_MY_TASKS_ITEM,
  TASK_ATTENDANCE_ITEM,
  TASK_MY_CALENDAR_ITEM,
];

export const TEAM_MODULE_ITEMS: ModuleNavItem[] = [
  TEAM_DASHBOARD_ITEM,
  TEAM_MEETING_ITEM,
  TEAM_CALENDAR_ITEM,
  TEAM_ANNOUNCEMENTS_ITEM,
  TEAM_APPROVAL_ITEM,
  TEAM_STRUCTURE_ITEM,
  TEAM_SOP_ITEM,
  TEAM_TODO_ITEM,
  TEAM_KPI_ITEM,
  TEAM_MODULE_ITEM,
];
