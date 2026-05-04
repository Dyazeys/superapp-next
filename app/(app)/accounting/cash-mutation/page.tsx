import { MutationWorkspace } from "@/features/accounting/mutation-workspace";

export default async function CashMutationPage() {
  return (
    <MutationWorkspace
      accountCode="11101"
      title="Mutasi Kas"
      description="Mutasi kas kecil — uang masuk, keluar, dan saldo kas berjalan."
    />
  );
}
