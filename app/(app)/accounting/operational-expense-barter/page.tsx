import { redirect } from "next/navigation";

export default function OperationalExpenseBarterPage() {
  redirect("/accounting/operational-expenses?mode=barter");
}
