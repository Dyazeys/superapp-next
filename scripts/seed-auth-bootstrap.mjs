#!/usr/bin/env node

import "dotenv/config";
import { Client } from "pg";
import { randomBytes, scryptSync } from "node:crypto";

const ROLE_PERMISSION_TEMPLATES = {
  OWNER: [
    "dashboard.view",
    "analytics.report_pnl.view",
    "analytics.budget_meters.view",
    "sales.order.view",
    "sales.order.create",
    "sales.order.update",
    "sales.order.delete",
    "sales.order.post",
    "sales.customer.view",
    "sales.customer.create",
    "sales.customer.update",
    "sales.customer.delete",
    "warehouse.vendor.view",
    "warehouse.vendor.create",
    "warehouse.vendor.update",
    "warehouse.vendor.delete",
    "warehouse.purchase_order.view",
    "warehouse.purchase_order.create",
    "warehouse.purchase_order.update",
    "warehouse.purchase_order.delete",
    "warehouse.inbound.view",
    "warehouse.inbound.create",
    "warehouse.inbound.update",
    "warehouse.inbound.post",
    "warehouse.adjustment.view",
    "warehouse.adjustment.create",
    "warehouse.adjustment.update",
    "warehouse.adjustment.post",
    "warehouse.stock.view",
    "product.category.view",
    "product.category.create",
    "product.category.update",
    "product.category.delete",
    "product.inventory.view",
    "product.inventory.create",
    "product.inventory.update",
    "product.inventory.delete",
    "product.master.view",
    "product.master.create",
    "product.master.update",
    "product.master.delete",
    "product.bom.view",
    "product.bom.create",
    "product.bom.update",
    "product.bom.delete",
    "channel.group.view",
    "channel.group.create",
    "channel.group.update",
    "channel.group.delete",
    "channel.category.view",
    "channel.category.create",
    "channel.category.update",
    "channel.category.delete",
    "channel.master.view",
    "channel.master.create",
    "channel.master.update",
    "channel.master.delete",
    "payout.record.view",
    "payout.record.create",
    "payout.record.update",
    "payout.record.delete",
    "payout.adjustment.view",
    "payout.adjustment.create",
    "payout.adjustment.update",
    "payout.adjustment.delete",
    "payout.transfer.view",
    "payout.transfer.create",
    "payout.transfer.update",
    "payout.transfer.delete",
    "payout.reconciliation.view",
    "accounting.account.view",
    "accounting.account.create",
    "accounting.account.update",
    "accounting.account.delete",
    "accounting.journal.view",
    "accounting.journal.create",
    "accounting.journal.update",
    "accounting.journal.delete",
    "accounting.opex.view",
    "accounting.opex.create",
    "accounting.opex.update",
    "accounting.opex.delete",
    "accounting.opex.post",
    "accounting.opex.void",
    "accounting.opex.barter.view",
    "accounting.opex.barter.create",
    "accounting.opex.barter.update",
    "accounting.opex.barter.delete",
    "accounting.opex.barter.post",
    "accounting.opex.barter.void",
    "marketing.workspace.view",
    "marketing.product_performance.view",
    "marketing.mp_ads.view",
    "marketing.shopee_traffic.view",
    "marketing.tiktok_traffic.view",
    "marketing.shopee_livestream.view",
    "marketing.tiktok_livestream.view",
    "content.workspace.view",
    "content.tiktok.view",
    "content.instagram.view",
    "content.daily_report.view",
    "content.daily_report.create",
    "content.daily_report.update",
    "content.daily_report.delete",
    "content.daily_report.approve",
    "auth.user.view",
    "auth.user.create",
    "auth.user.update",
    "auth.user.delete",
    "auth.user.reset_password",
    "auth.role.view",
    "auth.role.create",
    "auth.role.update",
    "auth.role.delete",
  ],
  DIREKTUR: [],
  LEADER: [
    "dashboard.view",
    "analytics.report_pnl.view",
    "analytics.budget_meters.view",
    "sales.order.view",
    "sales.order.create",
    "sales.order.update",
    "sales.order.delete",
    "sales.order.post",
    "sales.customer.view",
    "sales.customer.create",
    "sales.customer.update",
    "sales.customer.delete",
    "warehouse.vendor.view",
    "warehouse.vendor.create",
    "warehouse.vendor.update",
    "warehouse.vendor.delete",
    "warehouse.purchase_order.view",
    "warehouse.purchase_order.create",
    "warehouse.purchase_order.update",
    "warehouse.purchase_order.delete",
    "warehouse.inbound.view",
    "warehouse.inbound.create",
    "warehouse.inbound.update",
    "warehouse.inbound.post",
    "warehouse.adjustment.view",
    "warehouse.adjustment.create",
    "warehouse.adjustment.update",
    "warehouse.adjustment.post",
    "warehouse.stock.view",
    "payout.record.view",
    "payout.adjustment.view",
    "payout.transfer.view",
    "payout.reconciliation.view",
    "accounting.opex.view",
    "accounting.opex.create",
    "accounting.opex.update",
    "marketing.workspace.view",
    "marketing.product_performance.view",
    "marketing.mp_ads.view",
    "marketing.shopee_traffic.view",
    "marketing.tiktok_traffic.view",
    "marketing.shopee_livestream.view",
    "marketing.tiktok_livestream.view",
    "content.workspace.view",
    "content.tiktok.view",
    "content.instagram.view",
    "content.daily_report.view",
    "content.daily_report.create",
    "content.daily_report.update",
    "content.daily_report.delete",
    "content.daily_report.approve",
    "product.category.view",
    "product.inventory.view",
    "product.master.view",
    "product.bom.view",
    "channel.master.view",
  ],
  ADVERTISER: [
    "dashboard.view",
    "analytics.report_pnl.view",
    "analytics.budget_meters.view",
    "marketing.workspace.view",
    "marketing.product_performance.view",
    "marketing.mp_ads.view",
    "marketing.shopee_traffic.view",
    "marketing.tiktok_traffic.view",
    "marketing.shopee_livestream.view",
    "marketing.tiktok_livestream.view",
    "content.workspace.view",
    "content.tiktok.view",
    "content.instagram.view",
    "content.daily_report.view",
    "content.daily_report.create",
    "content.daily_report.update",
  ],
  SALES: [
    "dashboard.view",
    "sales.order.view",
    "sales.order.create",
    "sales.order.update",
    "sales.customer.view",
    "sales.customer.create",
    "sales.customer.update",
    "channel.master.view",
    "payout.record.view",
    "payout.adjustment.view",
    "payout.reconciliation.view",
  ],
  ACCOUNTING: [
    "dashboard.view",
    "analytics.report_pnl.view",
    "analytics.budget_meters.view",
    "accounting.account.view",
    "accounting.journal.view",
    "accounting.journal.create",
    "accounting.journal.update",
    "accounting.opex.view",
    "accounting.opex.create",
    "accounting.opex.update",
    "accounting.opex.post",
    "accounting.opex.void",
    "accounting.opex.barter.view",
    "accounting.opex.barter.create",
    "accounting.opex.barter.update",
    "accounting.opex.barter.post",
    "accounting.opex.barter.void",
    "payout.record.view",
    "payout.adjustment.view",
    "payout.transfer.view",
    "payout.transfer.create",
    "payout.transfer.update",
    "payout.reconciliation.view",
    "channel.master.view",
  ],
  PURCHASING: [
    "dashboard.view",
    "product.category.view",
    "product.inventory.view",
    "product.master.view",
    "product.bom.view",
    "warehouse.vendor.view",
    "warehouse.vendor.create",
    "warehouse.vendor.update",
    "warehouse.purchase_order.view",
    "warehouse.purchase_order.create",
    "warehouse.purchase_order.update",
    "warehouse.inbound.view",
    "warehouse.stock.view",
  ],
  WAREHOUSE: [
    "dashboard.view",
    "warehouse.vendor.view",
    "warehouse.purchase_order.view",
    "warehouse.purchase_order.create",
    "warehouse.purchase_order.update",
    "warehouse.inbound.view",
    "warehouse.inbound.create",
    "warehouse.inbound.update",
    "warehouse.inbound.post",
    "warehouse.adjustment.view",
    "warehouse.adjustment.create",
    "warehouse.adjustment.update",
    "warehouse.adjustment.post",
    "warehouse.return.view",
    "warehouse.return.create",
    "warehouse.return.update",
    "warehouse.return.post",
    "warehouse.stock.view",
    "product.inventory.view",
    "product.master.view",
  ],
  CONTENT_CREATOR: [
    "dashboard.view",
    "content.workspace.view",
    "content.tiktok.view",
    "content.instagram.view",
    "content.daily_report.view",
    "content.daily_report.create",
    "content.daily_report.update",
    "marketing.workspace.view",
    "marketing.product_performance.view",
  ],
};

ROLE_PERMISSION_TEMPLATES.DIREKTUR = ROLE_PERMISSION_TEMPLATES.OWNER.filter(
  (permission) => permission !== "auth.role.update"
);

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const N = 16384;
  const r = 8;
  const p = 1;
  const keyLength = 64;
  const derivedKey = scryptSync(password, salt, keyLength, { N, r, p }).toString("hex");

  return `scrypt$${N}$${r}$${p}$${salt}$${derivedKey}`;
}

const connectionString = process.env.DATABASE_URL;
const demoUsername = process.env.DEMO_ADMIN_EMAIL?.trim();
const demoPassword = process.env.DEMO_ADMIN_PASSWORD?.trim();

if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (!demoUsername || !demoPassword) {
  console.error("DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD are required.");
  process.exit(1);
}

const client = new Client({ connectionString });

try {
  await client.connect();
  await client.query("begin");

  const roleIds = new Map();

  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSION_TEMPLATES)) {
    const result = await client.query(
      `
        insert into auth.roles (role_name, permissions)
        values ($1, $2::json)
        on conflict (role_name)
        do update set permissions = excluded.permissions
        returning id
      `,
      [roleName, JSON.stringify(permissions)]
    );

    roleIds.set(roleName, result.rows[0].id);
  }

  const ownerRoleId = roleIds.get("OWNER");
  const ownerPasswordHash = hashPassword(demoPassword);

  await client.query(
    `
      insert into auth.users (role_id, username, full_name, password_hash, is_active)
      values ($1, $2, $3, $4, true)
      on conflict (username)
      do update set
        role_id = excluded.role_id,
        full_name = excluded.full_name,
        password_hash = excluded.password_hash,
        is_active = true,
        updated_at = now()
    `,
    [ownerRoleId, demoUsername, "System Admin", ownerPasswordHash]
  );

  await client.query("commit");

  console.log(
    JSON.stringify(
      {
        seeded_roles: Object.keys(ROLE_PERMISSION_TEMPLATES).length,
        bootstrap_owner_username: demoUsername,
        bootstrap_owner_role: "OWNER",
      },
      null,
      2
    )
  );
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error(error);
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}
