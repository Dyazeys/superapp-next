import { nanoid } from "nanoid";
import type { CustomerRecord, KpiCard, RevenuePoint } from "@/types";

export const KPI_CARDS: KpiCard[] = [
  { title: "Net revenue", value: "$128,400", trend: "+12.4% vs last month", icon: "revenue" },
  { title: "Active customers", value: "1,248", trend: "+84 this week", icon: "customers" },
  { title: "Inventory health", value: "97.2%", trend: "3 SKUs below threshold", icon: "inventory" },
  { title: "Analytics coverage", value: "14 boards", trend: "2 new pipeline views", icon: "analytics" },
];

export const REVENUE_SERIES: RevenuePoint[] = [
  { name: "Mon", revenue: 12000 },
  { name: "Tue", revenue: 17400 },
  { name: "Wed", revenue: 15900 },
  { name: "Thu", revenue: 22300 },
  { name: "Fri", revenue: 20400 },
  { name: "Sat", revenue: 18400 },
  { name: "Sun", revenue: 24800 },
];

export const RECENT_ACTIVITIES = [
  {
    id: nanoid(),
    title: "Sales order SO-2048 moved to fulfillment",
    description: "Warehouse queue acknowledged the pick ticket and reserved stock.",
    timestamp: "5 min ago",
  },
  {
    id: nanoid(),
    title: "Customer PT Nexus Retail updated payment terms",
    description: "Account manager revised contract terms from COD to NET-30.",
    timestamp: "21 min ago",
  },
  {
    id: nanoid(),
    title: "Low-stock alert on SKU INV-143",
    description: "Coverage dropped below the seven-day threshold for the East warehouse.",
    timestamp: "46 min ago",
  },
];

export const CUSTOMER_SEGMENTS = ["Enterprise", "SMB", "Distributor", "Online"];

export const DEMO_CUSTOMERS: CustomerRecord[] = [
  {
    id: nanoid(),
    code: "CUS-001",
    name: "Nexus Retail",
    email: "ops@nexus-retail.example",
    segment: "Enterprise",
    createdAt: "2026-03-19T10:00:00.000Z",
  },
  {
    id: nanoid(),
    code: "CUS-002",
    name: "Atlas Wholesale",
    email: "buyers@atlas-wholesale.example",
    segment: "Distributor",
    createdAt: "2026-03-12T08:30:00.000Z",
  },
  {
    id: nanoid(),
    code: "CUS-003",
    name: "Northwind Cafe Group",
    email: "finance@northwind-cafe.example",
    segment: "SMB",
    createdAt: "2026-03-08T14:15:00.000Z",
  },
];
