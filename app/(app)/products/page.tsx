import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { ProductWorkspace } from "@/features/product/product-workspace";
import Link from "next/link";
import { ArrowRight, Boxes, ListTree, Package2, Puzzle } from "lucide-react";

export default function ProductsPage() {
  return (
    <PageShell
      eyebrow="Product"
      title="Product module"
      description="Ringkasan modul Product untuk master data, inventory, dan struktur BOM dengan alur kerja yang tetap rapi."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <WorkspacePanel title="Pintasan cepat" description="Masuk ke sub-halaman utama tanpa mencari menu.">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/products/categories"
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <ListTree className="size-4" />
                </span>
                Categories
              </span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/products/inventory"
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Boxes className="size-4" />
                </span>
                Inventory
              </span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/products/master"
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Package2 className="size-4" />
                </span>
                Master Products
              </span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/products/bom"
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Puzzle className="size-4" />
                </span>
                Product BOM
              </span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Apa yang biasanya dikerjakan di sini"
          description="Bantuan singkat untuk pengguna non-teknis."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Mulai dari Categories untuk memastikan pengelompokan produk konsisten.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Siapkan master Inventory agar proses inbound dan pergerakan stok tetap terhubung.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Gunakan BOM untuk mendefinisikan komponen per SKU bila dibutuhkan.</p>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <ProductWorkspace />
    </PageShell>
  );
}
