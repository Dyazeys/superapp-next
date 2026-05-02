"use client";

import { useState } from "react";
import { MpAdsWorkspace } from "@/features/marketing/mp-ads-workspace";
import { ShopeeTrafficWorkspace } from "@/features/marketing/shopee-traffic-workspace";
import { ShopeeLivestreamWorkspace } from "@/features/marketing/shopee-livestream-workspace";
import { Button } from "@/components/ui/button";

type Tab = "ads" | "traffic" | "livestream";

const tabs: { key: Tab; label: string }[] = [
  { key: "ads", label: "MP Ads" },
  { key: "traffic", label: "Traffic" },
  { key: "livestream", label: "Livestream" },
];

export default function DataShopeePage() {
  const [tab, setTab] = useState<Tab>("ads");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Shopee</h1>
        <p className="text-muted-foreground">
          Kelola data MP Ads, Traffic, dan Livestream Shopee.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "ads" && <MpAdsWorkspace platform="shopee" />}
      {tab === "traffic" && <ShopeeTrafficWorkspace />}
      {tab === "livestream" && <ShopeeLivestreamWorkspace />}
    </div>
  );
}