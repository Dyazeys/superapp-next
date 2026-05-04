import { MutationWorkspace } from "@/features/accounting/mutation-workspace";

export default async function BankMutationPage() {
  return (
    <MutationWorkspace
      accountCode="11102"
      title="Mutasi BCA"
      description="Mutasi rekening Bank BCA — dana masuk, keluar, dan saldo berjalan."
    />
  );
}
