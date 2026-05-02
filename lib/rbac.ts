export const ROLE_CODES = [
  "OWNER",
  "DIREKTUR",
  "BRAND_OWNER",
  "LEADER",
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
export const SUPERADMIN_ROLE_CODE = "OWNER";
export const SUPERADMIN_ROLE_LABEL = "SUPERADMIIN";

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

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
    ...permissionsByPrefix(["sales.", "warehouse.", "marketing.", "content."]),
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
  ADVERTISER: uniquePermissions([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
    PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
    ...permissionsByPrefix(["marketing.", "content."]),
    PERMISSIONS.MARKETING_SHOPEE_TRAFFIC_VIEW,
    PERMISSIONS.MARKETING_SHOPEE_LIVESTREAM_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
    PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
    PERMISSIONS.ACCOUNTING_OPEX_POST,
    PERMISSIONS.ACCOUNTING_OPEX_VOID,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_VIEW,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_CREATE,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_UPDATE,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_POST,
    PERMISSIONS.ACCOUNTING_OPEX_BARTER_VOID,
    PERMISSIONS.PAYOUT_RECORD_VIEW,
    PERMISSIONS.PAYOUT_ADJUSTMENT_VIEW,
    PERMISSIONS.PAYOUT_TRANSFER_VIEW,
    PERMISSIONS.PAYOUT_TRANSFER_CREATE,
    PERMISSIONS.PAYOUT_TRANSFER_UPDATE,
    PERMISSIONS.PAYOUT_RECONCILIATION_VIEW,
    PERMISSIONS.CHANNEL_MASTER_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
    PERMISSIONS.WAREHOUSE_STOCK_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
    PERMISSIONS.WAREHOUSE_INBOUND_POST,
    PERMISSIONS.WAREHOUSE_ADJUSTMENT_VIEW,
    PERMISSIONS.WAREHOUSE_ADJUSTMENT_CREATE,
    PERMISSIONS.WAREHOUSE_ADJUSTMENT_UPDATE,
    PERMISSIONS.WAREHOUSE_ADJUSTMENT_POST,
    PERMISSIONS.WAREHOUSE_STOCK_VIEW,
    PERMISSIONS.PRODUCT_INVENTORY_VIEW,
    PERMISSIONS.PRODUCT_MASTER_VIEW,
    PERMISSIONS.TASK_WORKSPACE_VIEW,
    PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
    PERMISSIONS.TEAM_WORKSPACE_VIEW,
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
