export type KpiCard = {
  title: string;
  value: string;
  trend: string;
  icon: "revenue" | "customers" | "inventory" | "analytics";
};

export type RevenuePoint = {
  name: string;
  revenue: number;
};

export type CustomerRecord = {
  id: string;
  code: string;
  name: string;
  email: string;
  segment: string;
  createdAt: string;
};
