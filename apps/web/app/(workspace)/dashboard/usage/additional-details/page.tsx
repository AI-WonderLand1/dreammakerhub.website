import { redirect } from "next/navigation";

export default function LegacyAdditionalBillingDetailsPage() {
  redirect("/dashboard/usage/ai");
}
