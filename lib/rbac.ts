export const ROLE_CODES = [
  "OWNER",
  "DIREKTUR",
  "BRAND_OWNER",
  "LEADER",
  "MANAGER",
  "ADVERTISER",
  "SALES",
  "ACCOUNTING",
  "PURCHASING",
  "WAREHOUSE",
  "CONTENT_CREATOR",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  ANALYTICS_REPORT_PNL_VIEW: "analytics.report_pnl.view",
  ANALYTICS_BUDGET_METERS_VIEW: "analytics.budget_meters.view",

  SALES_ORDER_VIEW: "sales.order.view",
  SALES_ORDER_CREATE: "sales.order.create",
  SALES_ORDER_UPDATE: "sales.order.update",
  SALES_ORDER_DELETE: "sales.order.delete",
  SALES_ORDER_POST: "sales.order.post",
  SALES_CUSTOMER_VIEW: "sales.customer.view",
  SALES_CUSTOMER_CREATE: "sales.customer.create",
  SALES_CUSTOMER_UPDATE: "sales.customer.update",
  SALES_CUSTOMER_DELETE: "sales.customer.delete",

  WAREHOUSE_VENDOR_VIEW: "warehouse.vendor.view",
  WAREHOUSE_VENDOR_CREATE: "warehouse.vendor.create",
  WAREHOUSE_VENDOR_UPDATE: "warehouse.vendor.update",
  WAREHOUSE_VENDOR_DELETE: "warehouse.vendor.delete",
  WAREHOUSE_PURCHASE_ORDER_VIEW: "warehouse.purchase_order.view",
  WAREHOUSE_PURCHASE_ORDER_CREATE: "warehouse.purchase_order.create",
  WAREHOUSE_PURCHASE_ORDER_UPDATE: "warehouse.purchase_order.update",
  WAREHOUSE_PURCHASE_ORDER_DELETE: "warehouse.purchase_order.delete",
  WAREHOUSE_INBOUND_VIEW: "warehouse.inbound.view",
  WAREHOUSE_INBOUND_CREATE: "warehouse.inbound.create",
  WAREHOUSE_INBOUND_UPDATE: "warehouse.inbound.update",
  WAREHOUSE_INBOUND_POST: "warehouse.inbound.post",
  WAREHOUSE_ADJUSTMENT_VIEW: "warehouse.adjustment.view",
  WAREHOUSE_ADJUSTMENT_CREATE: "warehouse.adjustment.create",
  WAREHOUSE_ADJUSTMENT_UPDATE: "warehouse.adjustment.update",
  WAREHOUSE_ADJUSTMENT_POST: "warehouse.adjustment.post",
  WAREHOUSE_RETURN_VIEW: "warehouse.return.view",
  WAREHOUSE_RETURN_CREATE: "warehouse.return.create",
  WAREHOUSE_RETURN_UPDATE: "warehouse.return.update",
  WAREHOUSE_RETURN_POST: "warehouse.return.post",
  WAREHOUSE_STOCK_VIEW: "warehouse.stock.view",

  PRODUCT_CATEGORY_VIEW: "product.category.view",
  PRODUCT_CATEGORY_CREATE: "product.category.create",
  PRODUCT_CATEGORY_UPDATE: "product.category.update",
  PRODUCT_CATEGORY_DELETE: "product.category.delete",
  PRODUCT_INVENTORY_VIEW: "product.inventory.view",
  PRODUCT_INVENTORY_CREATE: "product.inventory.create",
  PRODUCT_INVENTORY_UPDATE: "product.inventory.update",
  PRODUCT_INVENTORY_DELETE: "product.inventory.delete",
  PRODUCT_MASTER_VIEW: "product.master.view",
  PRODUCT_MASTER_CREATE: "product.master.create",
  PRODUCT_MASTER_UPDATE: "product.master.update",
  PRODUCT_MASTER_DELETE: "product.master.delete",
  PRODUCT_BOM_VIEW: "product.bom.view",
  PRODUCT_BOM_CREATE: "product.bom.create",
  PRODUCT_BOM_UPDATE: "product.bom.update",
  PRODUCT_BOM_DELETE: "product.bom.delete",

  CHANNEL_GROUP_VIEW: "channel.group.view",
  CHANNEL_GROUP_CREATE: "channel.group.create",
  CHANNEL_GROUP_UPDATE: "channel.group.update",
  CHANNEL_GROUP_DELETE: "channel.group.delete",
  CHANNEL_CATEGORY_VIEW: "channel.category.view",
  CHANNEL_CATEGORY_CREATE: "channel.category.create",
  CHANNEL_CATEGORY_UPDATE: "channel.category.update",
  CHANNEL_CATEGORY_DELETE: "channel.category.delete",
  CHANNEL_MASTER_VIEW: "channel.master.view",
  CHANNEL_MASTER_CREATE: "channel.master.create",
  CHANNEL_MASTER_UPDATE: "channel.master.update",
  CHANNEL_MASTER_DELETE: "channel.master.delete",

  PAYOUT_RECORD_VIEW: "payout.record.view",
  PAYOUT_RECORD_CREATE: "payout.record.create",
  PAYOUT_RECORD_UPDATE: "payout.record.update",
  PAYOUT_RECORD_DELETE: "payout.record.delete",
  PAYOUT_ADJUSTMENT_VIEW: "payout.adjustment.view",
  PAYOUT_ADJUSTMENT_CREATE: "payout.adjustment.create",
  PAYOUT_ADJUSTMENT_UPDATE: "payout.adjustment.update",
  PAYOUT_ADJUSTMENT_DELETE: "payout.adjustment.delete",
  PAYOUT_TRANSFER_VIEW: "payout.transfer.view",
  PAYOUT_TRANSFER_CREATE: "payout.transfer.create",
  PAYOUT_TRANSFER_UPDATE: "payout.transfer.update",
  PAYOUT_TRANSFER_DELETE: "payout.transfer.delete",
  PAYOUT_RECONCILIATION_VIEW: "payout.reconciliation.view",

  ACCOUNTING_ACCOUNT_VIEW: "accounting.account.view",
  ACCOUNTING_ACCOUNT_CREATE: "accounting.account.create",
  ACCOUNTING_ACCOUNT_UPDATE: "accounting.account.update",
  ACCOUNTING_ACCOUNT_DELETE: "accounting.account.delete",
  ACCOUNTING_JOURNAL_VIEW: "accounting.journal.view",
  ACCOUNTING_JOURNAL_CREATE: "accounting.journal.create",
  ACCOUNTING_JOURNAL_UPDATE: "accounting.journal.update",
  ACCOUNTING_JOURNAL_DELETE: "accounting.journal.delete",
  ACCOUNTING_OPEX_VIEW: "accounting.opex.view",
  ACCOUNTING_OPEX_CREATE: "accounting.opex.create",
  ACCOUNTING_OPEX_UPDATE: "accounting.opex.update",
  ACCOUNTING_OPEX_DELETE: "accounting.opex.delete",
  ACCOUNTING_OPEX_POST: "accounting.opex.post",
  ACCOUNTING_OPEX_VOID: "accounting.opex.void",
  ACCOUNTING_OPEX_BARTER_VIEW: "accounting.opex.barter.view",
  ACCOUNTING_OPEX_BARTER_CREATE: "accounting.opex.barter.create",
  ACCOUNTING_OPEX_BARTER_UPDATE: "accounting.opex.barter.update",
  ACCOUNTING_OPEX_BARTER_DELETE: "accounting.opex.barter.delete",
  ACCOUNTING_OPEX_BARTER_POST: "accounting.opex.barter.post",
  ACCOUNTING_OPEX_BARTER_VOID: "accounting.opex.barter.void",
  ACCOUNTING_MUTATION_VIEW: "accounting.mutation.view",

  MARKETING_WORKSPACE_VIEW: "marketing.workspace.view",
  MARKETING_PRODUCT_PERFORMANCE_VIEW: "marketing.product_performance.view",
  MARKETING_MP_ADS_VIEW: "marketing.mp_ads.view",
  MARKETING_SHOPEE_TRAFFIC_VIEW: "marketing.shopee_traffic.view",
  MARKETING_SHOPEE_LIVESTREAM_VIEW: "marketing.shopee_livestream.view",
  MARKETING_TIKTOK_TRAFFIC_VIEW: "marketing.tiktok_traffic.view",
  MARKETING_TIKTOK_LIVESTREAM_VIEW: "marketing.tiktok_livestream.view",

  CONTENT_WORKSPACE_VIEW: "content.workspace.view",
  CONTENT_TIKTOK_VIEW: "content.tiktok.view",
  CONTENT_INSTAGRAM_VIEW: "content.instagram.view",
  CONTENT_DAILY_REPORT_VIEW: "content.daily_report.view",
  CONTENT_DAILY_REPORT_CREATE: "content.daily_report.create",
  CONTENT_DAILY_REPORT_UPDATE: "content.daily_report.update",
  CONTENT_DAILY_REPORT_DELETE: "content.daily_report.delete",
  CONTENT_DAILY_REPORT_APPROVE: "content.daily_report.approve",

  TASK_WORKSPACE_VIEW: "task.workspace.view",
  TEAM_WORKSPACE_VIEW: "team.workspace.view",

  TEAM_MEETINGS_VIEW: "team.meetings.view",
  TEAM_MEETINGS_CREATE: "team.meetings.create",
  TEAM_MEETINGS_UPDATE: "team.meetings.update",
  TEAM_MEETINGS_DELETE: "team.meetings.delete",

  TEAM_MEETING_TODOS_VIEW: "team.meeting_todos.view",
  TEAM_MEETING_TODOS_CREATE: "team.meeting_todos.create",
  TEAM_MEETING_TODOS_UPDATE: "team.meeting_todos.update",
  TEAM_MEETING_TODOS_DELETE: "team.meeting_todos.delete",

  TEAM_ANNOUNCEMENTS_VIEW: "team.announcements.view",
  TEAM_ANNOUNCEMENTS_CREATE: "team.announcements.create",
  TEAM_ANNOUNCEMENTS_UPDATE: "team.announcements.update",
  TEAM_ANNOUNCEMENTS_DELETE: "team.announcements.delete",
  TEAM_ANNOUNCEMENTS_PUBLISH: "team.announcements.publish",

  TEAM_APPROVALS_VIEW: "team.approvals.view",
  TEAM_APPROVALS_LEADER_APPROVE: "team.approvals.leader.approve",
  TEAM_APPROVALS_LEADER_REJECT: "team.approvals.leader.reject",
  TEAM_APPROVALS_MANAGER_APPROVE: "team.approvals.manager.approve",
  TEAM_APPROVALS_MANAGER_REJECT: "team.approvals.manager.reject",
  TEAM_APPROVALS_ACKNOWLEDGE: "team.approvals.acknowledge",

  TEAM_DEPARTMENTS_VIEW: "team.departments.view",
  TEAM_DEPARTMENTS_CREATE: "team.departments.create",
  TEAM_DEPARTMENTS_UPDATE: "team.departments.update",
  TEAM_DEPARTMENTS_DELETE: "team.departments.delete",
  TEAM_DEPARTMENTS_MEMBERS_MANAGE: "team.departments.members.manage",

  AUTH_USER_VIEW: "auth.user.view",
  AUTH_USER_CREATE: "auth.user.create",
  AUTH_USER_UPDATE: "auth.user.update",
  AUTH_USER_DELETE: "auth.user.delete",
  AUTH_USER_RESET_PASSWORD: "auth.user.reset_password",
  AUTH_ROLE_VIEW: "auth.role.view",
  AUTH_ROLE_CREATE: "auth.role.create",
  AUTH_ROLE_UPDATE: "auth.role.update",
  AUTH_ROLE_DELETE: "auth.role.delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type PermissionEntityGroup = {
  key: string;
  label: string;
  permissions: Permission[];
};

export type PermissionDomainGroup = {
  domain: string;
  label: string;
  entities: PermissionEntityGroup[];
};

export const PERMISSION_GROUPS: PermissionDomainGroup[] = [
  {
    domain: "dashboard",
    label: "Dashboard",
    entities: [
      {
        key: "dashboard",
        label: "Dashboard",
        permissions: [PERMISSIONS.DASHBOARD_VIEW],
      },
    ],
  },
  {
    domain: "analytics",
    label: "Analitik",
    entities: [
      {
        key: "analytics.report_pnl",
        label: "Laporan P&L",
        permissions: [PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW],
      },
      {
        key: "analytics.budget_meters",
        label: "Budget Meters",
        permissions: [PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW],
      },
    ],
  },
  {
    domain: "sales",
    label: "Penjualan",
    entities: [
      {
        key: "sales.order",
        label: "Order",
        permissions: [
          PERMISSIONS.SALES_ORDER_VIEW,
          PERMISSIONS.SALES_ORDER_CREATE,
          PERMISSIONS.SALES_ORDER_UPDATE,
          PERMISSIONS.SALES_ORDER_DELETE,
          PERMISSIONS.SALES_ORDER_POST,
        ],
      },
      {
        key: "sales.customer",
        label: "Customer",
        permissions: [
          PERMISSIONS.SALES_CUSTOMER_VIEW,
          PERMISSIONS.SALES_CUSTOMER_CREATE,
          PERMISSIONS.SALES_CUSTOMER_UPDATE,
          PERMISSIONS.SALES_CUSTOMER_DELETE,
        ],
      },
    ],
  },
  {
    domain: "warehouse",
    label: "Gudang",
    entities: [
      {
        key: "warehouse.vendor",
        label: "Vendor",
        permissions: [
          PERMISSIONS.WAREHOUSE_VENDOR_VIEW,
          PERMISSIONS.WAREHOUSE_VENDOR_CREATE,
          PERMISSIONS.WAREHOUSE_VENDOR_UPDATE,
          PERMISSIONS.WAREHOUSE_VENDOR_DELETE,
        ],
      },
      {
        key: "warehouse.purchase_order",
        label: "Purchase Order",
        permissions: [
          PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_VIEW,
          PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_CREATE,
          PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_UPDATE,
          PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_DELETE,
        ],
      },
      {
        key: "warehouse.inbound",
        label: "Inbound",
        permissions: [
          PERMISSIONS.WAREHOUSE_INBOUND_VIEW,
          PERMISSIONS.WAREHOUSE_INBOUND_CREATE,
          PERMISSIONS.WAREHOUSE_INBOUND_UPDATE,
          PERMISSIONS.WAREHOUSE_INBOUND_POST,
        ],
      },
      {
        key: "warehouse.adjustment",
        label: "Adjustment",
        permissions: [
          PERMISSIONS.WAREHOUSE_ADJUSTMENT_VIEW,
          PERMISSIONS.WAREHOUSE_ADJUSTMENT_CREATE,
          PERMISSIONS.WAREHOUSE_ADJUSTMENT_UPDATE,
          PERMISSIONS.WAREHOUSE_ADJUSTMENT_POST,
        ],
      },
      {
        key: "warehouse.return",
        label: "Return",
        permissions: [
          PERMISSIONS.WAREHOUSE_RETURN_VIEW,
          PERMISSIONS.WAREHOUSE_RETURN_CREATE,
          PERMISSIONS.WAREHOUSE_RETURN_UPDATE,
          PERMISSIONS.WAREHOUSE_RETURN_POST,
        ],
      },
      {
        key: "warehouse.stock",
        label: "Stok",
        permissions: [PERMISSIONS.WAREHOUSE_STOCK_VIEW],
      },
    ],
  },
  {
    domain: "product",
    label: "Produk",
    entities: [
      {
        key: "product.category",
        label: "Kategori",
        permissions: [
          PERMISSIONS.PRODUCT_CATEGORY_VIEW,
          PERMISSIONS.PRODUCT_CATEGORY_CREATE,
          PERMISSIONS.PRODUCT_CATEGORY_UPDATE,
          PERMISSIONS.PRODUCT_CATEGORY_DELETE,
        ],
      },
      {
        key: "product.inventory",
        label: "Inventori",
        permissions: [
          PERMISSIONS.PRODUCT_INVENTORY_VIEW,
          PERMISSIONS.PRODUCT_INVENTORY_CREATE,
          PERMISSIONS.PRODUCT_INVENTORY_UPDATE,
          PERMISSIONS.PRODUCT_INVENTORY_DELETE,
        ],
      },
      {
        key: "product.master",
        label: "Master Produk",
        permissions: [
          PERMISSIONS.PRODUCT_MASTER_VIEW,
          PERMISSIONS.PRODUCT_MASTER_CREATE,
          PERMISSIONS.PRODUCT_MASTER_UPDATE,
          PERMISSIONS.PRODUCT_MASTER_DELETE,
        ],
      },
      {
        key: "product.bom",
        label: "BOM",
        permissions: [
          PERMISSIONS.PRODUCT_BOM_VIEW,
          PERMISSIONS.PRODUCT_BOM_CREATE,
          PERMISSIONS.PRODUCT_BOM_UPDATE,
          PERMISSIONS.PRODUCT_BOM_DELETE,
        ],
      },
    ],
  },
  {
    domain: "channel",
    label: "Channel",
    entities: [
      {
        key: "channel.group",
        label: "Grup Channel",
        permissions: [
          PERMISSIONS.CHANNEL_GROUP_VIEW,
          PERMISSIONS.CHANNEL_GROUP_CREATE,
          PERMISSIONS.CHANNEL_GROUP_UPDATE,
          PERMISSIONS.CHANNEL_GROUP_DELETE,
        ],
      },
      {
        key: "channel.category",
        label: "Kategori Channel",
        permissions: [
          PERMISSIONS.CHANNEL_CATEGORY_VIEW,
          PERMISSIONS.CHANNEL_CATEGORY_CREATE,
          PERMISSIONS.CHANNEL_CATEGORY_UPDATE,
          PERMISSIONS.CHANNEL_CATEGORY_DELETE,
        ],
      },
      {
        key: "channel.master",
        label: "Master Channel",
        permissions: [
          PERMISSIONS.CHANNEL_MASTER_VIEW,
          PERMISSIONS.CHANNEL_MASTER_CREATE,
          PERMISSIONS.CHANNEL_MASTER_UPDATE,
          PERMISSIONS.CHANNEL_MASTER_DELETE,
        ],
      },
    ],
  },
  {
    domain: "payout",
    label: "Pembayaran",
    entities: [
      {
        key: "payout.record",
        label: "Record",
        permissions: [
          PERMISSIONS.PAYOUT_RECORD_VIEW,
          PERMISSIONS.PAYOUT_RECORD_CREATE,
          PERMISSIONS.PAYOUT_RECORD_UPDATE,
          PERMISSIONS.PAYOUT_RECORD_DELETE,
        ],
      },
      {
        key: "payout.adjustment",
        label: "Adjustment",
        permissions: [
          PERMISSIONS.PAYOUT_ADJUSTMENT_VIEW,
          PERMISSIONS.PAYOUT_ADJUSTMENT_CREATE,
          PERMISSIONS.PAYOUT_ADJUSTMENT_UPDATE,
          PERMISSIONS.PAYOUT_ADJUSTMENT_DELETE,
        ],
      },
      {
        key: "payout.transfer",
        label: "Transfer",
        permissions: [
          PERMISSIONS.PAYOUT_TRANSFER_VIEW,
          PERMISSIONS.PAYOUT_TRANSFER_CREATE,
          PERMISSIONS.PAYOUT_TRANSFER_UPDATE,
          PERMISSIONS.PAYOUT_TRANSFER_DELETE,
        ],
      },
      {
        key: "payout.reconciliation",
        label: "Rekonsiliasi",
        permissions: [PERMISSIONS.PAYOUT_RECONCILIATION_VIEW],
      },
    ],
  },
  {
    domain: "accounting",
    label: "Akuntansi",
    entities: [
      {
        key: "accounting.account",
        label: "Akun",
        permissions: [
          PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW,
          PERMISSIONS.ACCOUNTING_ACCOUNT_CREATE,
          PERMISSIONS.ACCOUNTING_ACCOUNT_UPDATE,
          PERMISSIONS.ACCOUNTING_ACCOUNT_DELETE,
        ],
      },
      {
        key: "accounting.journal",
        label: "Jurnal",
        permissions: [
          PERMISSIONS.ACCOUNTING_JOURNAL_VIEW,
          PERMISSIONS.ACCOUNTING_JOURNAL_CREATE,
          PERMISSIONS.ACCOUNTING_JOURNAL_UPDATE,
          PERMISSIONS.ACCOUNTING_JOURNAL_DELETE,
        ],
      },
      {
        key: "accounting.opex",
        label: "Operasional",
        permissions: [
          PERMISSIONS.ACCOUNTING_OPEX_VIEW,
          PERMISSIONS.ACCOUNTING_OPEX_CREATE,
          PERMISSIONS.ACCOUNTING_OPEX_UPDATE,
          PERMISSIONS.ACCOUNTING_OPEX_DELETE,
          PERMISSIONS.ACCOUNTING_OPEX_POST,
          PERMISSIONS.ACCOUNTING_OPEX_VOID,
        ],
      },
      {
        key: "accounting.opex.barter",
        label: "Barter",
        permissions: [
          PERMISSIONS.ACCOUNTING_OPEX_BARTER_VIEW,
          PERMISSIONS.ACCOUNTING_OPEX_BARTER_CREATE,
          PERMISSIONS.ACCOUNTING_OPEX_BARTER_UPDATE,
          PERMISSIONS.ACCOUNTING_OPEX_BARTER_DELETE,
          PERMISSIONS.ACCOUNTING_OPEX_BARTER_POST,
          PERMISSIONS.ACCOUNTING_OPEX_BARTER_VOID,
        ],
      },
      {
        key: "accounting.mutation",
        label: "Mutasi",
        permissions: [
          PERMISSIONS.ACCOUNTING_MUTATION_VIEW,
        ],
      },
    ],
  },
  {
    domain: "marketing",
    label: "Marketing",
    entities: [
      {
        key: "marketing.workspace",
        label: "Workspace",
        permissions: [PERMISSIONS.MARKETING_WORKSPACE_VIEW],
      },
      {
        key: "marketing.product_performance",
        label: "Product Performance",
        permissions: [PERMISSIONS.MARKETING_PRODUCT_PERFORMANCE_VIEW],
      },
      {
        key: "marketing.mp_ads",
        label: "MP Ads",
        permissions: [PERMISSIONS.MARKETING_MP_ADS_VIEW],
      },
      {
        key: "marketing.shopee_traffic",
        label: "Shopee Traffic",
        permissions: [PERMISSIONS.MARKETING_SHOPEE_TRAFFIC_VIEW],
      },
      {
        key: "marketing.shopee_livestream",
        label: "Shopee Livestream",
        permissions: [PERMISSIONS.MARKETING_SHOPEE_LIVESTREAM_VIEW],
      },
      {
        key: "marketing.tiktok_traffic",
        label: "TikTok Traffic",
        permissions: [PERMISSIONS.MARKETING_TIKTOK_TRAFFIC_VIEW],
      },
      {
        key: "marketing.tiktok_livestream",
        label: "TikTok Livestream",
        permissions: [PERMISSIONS.MARKETING_TIKTOK_LIVESTREAM_VIEW],
      },
    ],
  },
  {
    domain: "content",
    label: "Konten",
    entities: [
      {
        key: "content.workspace",
        label: "Workspace",
        permissions: [PERMISSIONS.CONTENT_WORKSPACE_VIEW],
      },
      {
        key: "content.tiktok",
        label: "TikTok",
        permissions: [PERMISSIONS.CONTENT_TIKTOK_VIEW],
      },
      {
        key: "content.instagram",
        label: "Instagram",
        permissions: [PERMISSIONS.CONTENT_INSTAGRAM_VIEW],
      },
      {
        key: "content.daily_report",
        label: "Laporan Harian",
        permissions: [
          PERMISSIONS.CONTENT_DAILY_REPORT_VIEW,
          PERMISSIONS.CONTENT_DAILY_REPORT_CREATE,
          PERMISSIONS.CONTENT_DAILY_REPORT_UPDATE,
          PERMISSIONS.CONTENT_DAILY_REPORT_DELETE,
          PERMISSIONS.CONTENT_DAILY_REPORT_APPROVE,
        ],
      },
    ],
  },
  {
    domain: "task",
    label: "Tugas",
    entities: [
      {
        key: "task.workspace",
        label: "Task Workspace",
        permissions: [PERMISSIONS.TASK_WORKSPACE_VIEW],
      },
    ],
  },
  {
    domain: "team",
    label: "Tim",
    entities: [
      {
        key: "team.workspace",
        label: "Team Workspace",
        permissions: [PERMISSIONS.TEAM_WORKSPACE_VIEW],
      },
      {
        key: "team.meetings",
        label: "Meeting",
        permissions: [
          PERMISSIONS.TEAM_MEETINGS_VIEW,
          PERMISSIONS.TEAM_MEETINGS_CREATE,
          PERMISSIONS.TEAM_MEETINGS_UPDATE,
          PERMISSIONS.TEAM_MEETINGS_DELETE,
        ],
      },
      {
        key: "team.meeting_todos",
        label: "Meeting To-Do",
        permissions: [
          PERMISSIONS.TEAM_MEETING_TODOS_VIEW,
          PERMISSIONS.TEAM_MEETING_TODOS_CREATE,
          PERMISSIONS.TEAM_MEETING_TODOS_UPDATE,
          PERMISSIONS.TEAM_MEETING_TODOS_DELETE,
        ],
      },
      {
        key: "team.announcements",
        label: "Pengumuman",
        permissions: [
          PERMISSIONS.TEAM_ANNOUNCEMENTS_VIEW,
          PERMISSIONS.TEAM_ANNOUNCEMENTS_CREATE,
          PERMISSIONS.TEAM_ANNOUNCEMENTS_UPDATE,
          PERMISSIONS.TEAM_ANNOUNCEMENTS_DELETE,
          PERMISSIONS.TEAM_ANNOUNCEMENTS_PUBLISH,
        ],
      },
      {
        key: "team.approvals.leader",
        label: "Approval Leader",
        permissions: [
          PERMISSIONS.TEAM_APPROVALS_VIEW,
          PERMISSIONS.TEAM_APPROVALS_LEADER_APPROVE,
          PERMISSIONS.TEAM_APPROVALS_LEADER_REJECT,
        ],
      },
      {
        key: "team.approvals.manager",
        label: "Approval Manager",
        permissions: [
          PERMISSIONS.TEAM_APPROVALS_VIEW,
          PERMISSIONS.TEAM_APPROVALS_MANAGER_APPROVE,
          PERMISSIONS.TEAM_APPROVALS_MANAGER_REJECT,
          PERMISSIONS.TEAM_APPROVALS_ACKNOWLEDGE,
        ],
      },
      {
        key: "team.departments",
        label: "Departemen",
        permissions: [
          PERMISSIONS.TEAM_DEPARTMENTS_VIEW,
          PERMISSIONS.TEAM_DEPARTMENTS_CREATE,
          PERMISSIONS.TEAM_DEPARTMENTS_UPDATE,
          PERMISSIONS.TEAM_DEPARTMENTS_DELETE,
          PERMISSIONS.TEAM_DEPARTMENTS_MEMBERS_MANAGE,
        ],
      },
    ],
  },
  {
    domain: "auth",
    label: "Autentikasi",
    entities: [
      {
        key: "auth.user",
        label: "User",
        permissions: [
          PERMISSIONS.AUTH_USER_VIEW,
          PERMISSIONS.AUTH_USER_CREATE,
          PERMISSIONS.AUTH_USER_UPDATE,
          PERMISSIONS.AUTH_USER_DELETE,
          PERMISSIONS.AUTH_USER_RESET_PASSWORD,
        ],
      },
      {
        key: "auth.role",
        label: "Role",
        permissions: [
          PERMISSIONS.AUTH_ROLE_VIEW,
          PERMISSIONS.AUTH_ROLE_CREATE,
          PERMISSIONS.AUTH_ROLE_UPDATE,
          PERMISSIONS.AUTH_ROLE_DELETE,
        ],
      },
    ],
  },
];

const ACTION_LABELS: Record<string, string> = {
  view: "Lihat",
  create: "Buat",
  update: "Ubah",
  delete: "Hapus",
  post: "Posting",
  void: "Void",
  reset_password: "Reset Password",
  approve: "Setujui",
  reject: "Tolak",
  acknowledge: "Acknowledge",
  publish: "Publikasi",
  members_manage: "Kelola Anggota",
};

export function getPermissionActionLabel(permission: string): string {
  const parts = permission.split(".");
  const action = parts[parts.length - 1];
  return ACTION_LABELS[action] ?? action;
}

export const SUPERADMIN_ROLE_CODE = "OWNER";
export const SUPERADMIN_ROLE_LABEL = "SUPERADMIN";

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const TEAM_VIEW_PERMISSIONS = [
  PERMISSIONS.TEAM_WORKSPACE_VIEW,
  PERMISSIONS.TEAM_MEETINGS_VIEW,
  PERMISSIONS.TEAM_MEETING_TODOS_VIEW,
  PERMISSIONS.TEAM_ANNOUNCEMENTS_VIEW,
  PERMISSIONS.TEAM_APPROVALS_VIEW,
  PERMISSIONS.TEAM_DEPARTMENTS_VIEW,
];

function uniquePermissions(permissions: Permission[]) {
  return Array.from(new Set(permissions));
}

function permissionsByPrefix(prefixes: string[]) {
  return ALL_PERMISSIONS.filter((permission) =>
    prefixes.some((prefix) => permission.startsWith(prefix))
  );
}

export const ROLE_PERMISSION_TEMPLATES: Record<RoleCode, Permission[]> = {
  OWNER: uniquePermissions(ALL_PERMISSIONS),
  DIREKTUR: uniquePermissions(
    ALL_PERMISSIONS.filter((permission) => permission !== PERMISSIONS.AUTH_ROLE_UPDATE)
  ),
  BRAND_OWNER: uniquePermissions(
    ALL_PERMISSIONS.filter((p) => p.endsWith(".view"))
  ),
  LEADER: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
    PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
    ...permissionsByPrefix(["sales.", "warehouse.", "marketing.", "content."]).filter(
      (p) => p !== PERMISSIONS.SALES_ORDER_POST
        && p !== PERMISSIONS.WAREHOUSE_INBOUND_POST
        && p !== PERMISSIONS.WAREHOUSE_ADJUSTMENT_POST
    ),
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    PERMISSIONS.AUTH_USER_VIEW,
    ...permissionsByPrefix(["team."]).filter(
      (p) => !p.startsWith("team.approvals.manager")
    ),
    PERMISSIONS.TEAM_APPROVALS_LEADER_APPROVE,
    PERMISSIONS.TEAM_APPROVALS_LEADER_REJECT,
    PERMISSIONS.PAYOUT_RECORD_VIEW,
    PERMISSIONS.PAYOUT_ADJUSTMENT_VIEW,
    PERMISSIONS.PAYOUT_TRANSFER_VIEW,
    PERMISSIONS.PAYOUT_RECONCILIATION_VIEW,
    PERMISSIONS.ACCOUNTING_OPEX_VIEW,
    PERMISSIONS.ACCOUNTING_OPEX_CREATE,
    PERMISSIONS.ACCOUNTING_OPEX_UPDATE,
    PERMISSIONS.PRODUCT_CATEGORY_VIEW,
    PERMISSIONS.PRODUCT_INVENTORY_VIEW,
    PERMISSIONS.PRODUCT_MASTER_VIEW,
    PERMISSIONS.PRODUCT_BOM_VIEW,
    PERMISSIONS.CHANNEL_MASTER_VIEW,
  ]),
  MANAGER: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
    PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
    PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW,
    PERMISSIONS.ACCOUNTING_JOURNAL_VIEW,
    PERMISSIONS.ACCOUNTING_OPEX_VIEW,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_VIEW,
    PERMISSIONS.ACCOUNTING_MUTATION_VIEW,
    PERMISSIONS.PAYOUT_RECORD_VIEW,
    PERMISSIONS.PAYOUT_ADJUSTMENT_VIEW,
    PERMISSIONS.PAYOUT_TRANSFER_VIEW,
    PERMISSIONS.PAYOUT_RECONCILIATION_VIEW,
    PERMISSIONS.SALES_ORDER_VIEW,
    PERMISSIONS.WAREHOUSE_STOCK_VIEW,
    PERMISSIONS.PRODUCT_INVENTORY_VIEW,
    PERMISSIONS.PRODUCT_MASTER_VIEW,
    PERMISSIONS.CHANNEL_MASTER_VIEW,
    PERMISSIONS.TEAM_WORKSPACE_VIEW,
    PERMISSIONS.TEAM_APPROVALS_VIEW,
    PERMISSIONS.TEAM_APPROVALS_MANAGER_APPROVE,
    PERMISSIONS.TEAM_APPROVALS_MANAGER_REJECT,
    PERMISSIONS.TEAM_APPROVALS_ACKNOWLEDGE,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
  ]),
  ADVERTISER: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
    PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
    ...permissionsByPrefix(["marketing.", "content."]),
    PERMISSIONS.MARKETING_SHOPEE_TRAFFIC_VIEW,
    PERMISSIONS.MARKETING_SHOPEE_LIVESTREAM_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    ...TEAM_VIEW_PERMISSIONS,
  ]),
  SALES: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SALES_ORDER_VIEW,
    PERMISSIONS.SALES_ORDER_CREATE,
    PERMISSIONS.SALES_ORDER_UPDATE,
    PERMISSIONS.SALES_CUSTOMER_VIEW,
    PERMISSIONS.SALES_CUSTOMER_CREATE,
    PERMISSIONS.SALES_CUSTOMER_UPDATE,
    PERMISSIONS.CHANNEL_MASTER_VIEW,
    PERMISSIONS.PAYOUT_RECORD_VIEW,
    PERMISSIONS.PAYOUT_ADJUSTMENT_VIEW,
    PERMISSIONS.PAYOUT_RECONCILIATION_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    ...TEAM_VIEW_PERMISSIONS,
  ]),
  ACCOUNTING: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
    PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
    PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW,
    PERMISSIONS.ACCOUNTING_JOURNAL_VIEW,
    PERMISSIONS.ACCOUNTING_JOURNAL_CREATE,
    PERMISSIONS.ACCOUNTING_JOURNAL_UPDATE,
    PERMISSIONS.ACCOUNTING_OPEX_VIEW,
    PERMISSIONS.ACCOUNTING_OPEX_CREATE,
    PERMISSIONS.ACCOUNTING_OPEX_UPDATE,
    PERMISSIONS.ACCOUNTING_OPEX_VOID,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_VIEW,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_CREATE,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_UPDATE,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_VOID,
    PERMISSIONS.ACCOUNTING_MUTATION_VIEW,
    PERMISSIONS.PAYOUT_RECORD_VIEW,
    PERMISSIONS.PAYOUT_ADJUSTMENT_VIEW,
    PERMISSIONS.PAYOUT_TRANSFER_VIEW,
    PERMISSIONS.PAYOUT_TRANSFER_CREATE,
    PERMISSIONS.PAYOUT_TRANSFER_UPDATE,
    PERMISSIONS.PAYOUT_RECONCILIATION_VIEW,
    PERMISSIONS.CHANNEL_MASTER_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    ...TEAM_VIEW_PERMISSIONS,
  ]),
  PURCHASING: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCT_CATEGORY_VIEW,
    PERMISSIONS.PRODUCT_INVENTORY_VIEW,
    PERMISSIONS.PRODUCT_MASTER_VIEW,
    PERMISSIONS.PRODUCT_BOM_VIEW,
    PERMISSIONS.WAREHOUSE_VENDOR_VIEW,
    PERMISSIONS.WAREHOUSE_VENDOR_CREATE,
    PERMISSIONS.WAREHOUSE_VENDOR_UPDATE,
    PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_VIEW,
    PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_CREATE,
    PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_UPDATE,
    PERMISSIONS.WAREHOUSE_INBOUND_VIEW,
    PERMISSIONS.WAREHOUSE_RETURN_VIEW,
PERMISSIONS.WAREHOUSE_STOCK_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    ...TEAM_VIEW_PERMISSIONS,
  ]),
  WAREHOUSE: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.WAREHOUSE_VENDOR_VIEW,
    PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_VIEW,
    PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_CREATE,
    PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_UPDATE,
    PERMISSIONS.WAREHOUSE_INBOUND_VIEW,
    PERMISSIONS.WAREHOUSE_INBOUND_CREATE,
    PERMISSIONS.WAREHOUSE_INBOUND_UPDATE,
    PERMISSIONS.WAREHOUSE_ADJUSTMENT_VIEW,
    PERMISSIONS.WAREHOUSE_ADJUSTMENT_CREATE,
    PERMISSIONS.WAREHOUSE_ADJUSTMENT_UPDATE,
    PERMISSIONS.WAREHOUSE_RETURN_VIEW,
    PERMISSIONS.WAREHOUSE_RETURN_CREATE,
    PERMISSIONS.WAREHOUSE_RETURN_UPDATE,
    PERMISSIONS.WAREHOUSE_RETURN_POST,
    PERMISSIONS.WAREHOUSE_STOCK_VIEW,
    PERMISSIONS.PRODUCT_INVENTORY_VIEW,
    PERMISSIONS.PRODUCT_MASTER_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    ...TEAM_VIEW_PERMISSIONS,
  ]),
  CONTENT_CREATOR: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CONTENT_WORKSPACE_VIEW,
    PERMISSIONS.CONTENT_TIKTOK_VIEW,
    PERMISSIONS.CONTENT_INSTAGRAM_VIEW,
    PERMISSIONS.CONTENT_DAILY_REPORT_VIEW,
    PERMISSIONS.CONTENT_DAILY_REPORT_CREATE,
    PERMISSIONS.CONTENT_DAILY_REPORT_UPDATE,
    PERMISSIONS.MARKETING_WORKSPACE_VIEW,
    PERMISSIONS.MARKETING_PRODUCT_PERFORMANCE_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    ...TEAM_VIEW_PERMISSIONS,
  ]),
};

export function hasPermission(
  permissions: string[] | null | undefined,
  permission: Permission
) {
  if (!permissions?.length) return false;
  return permissions.includes(permission);
}

export function hasAnyPermission(
  permissions: string[] | null | undefined,
  requiredPermissions: Permission[]
) {
  if (!permissions?.length) return false;
  return requiredPermissions.some((permission) => permissions.includes(permission));
}

export function isSuperadminRole(roleName: string | null | undefined) {
  if (!roleName) return false;
  const normalized = roleName.trim().toUpperCase();
  return normalized === SUPERADMIN_ROLE_CODE || normalized === SUPERADMIN_ROLE_LABEL;
}

export function getRoleDisplayName(roleName: string | null | undefined) {
  if (!roleName) return "UNASSIGNED";
  if (isSuperadminRole(roleName)) return SUPERADMIN_ROLE_LABEL;
  return roleName;
}
