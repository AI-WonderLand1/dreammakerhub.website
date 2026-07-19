import { redirect } from "next/navigation";

export default function SubscriptionSuccessPage() {
  redirect("/subscription?success=true");
}
