import { PageShell } from "@/components/foundation/page-shell";
import { ProductWorkspace } from "@/features/product/product-workspace";

export default function ProductsPage() {
  return (
    <PageShell
      eyebrow="Product"
      title="Product module"
      description="Migrated Product Categories, Master Inventory, Master Products, and Product BOM onto the new stack using the existing database structure."
    >
      <ProductWorkspace />
    </PageShell>
  );
}
