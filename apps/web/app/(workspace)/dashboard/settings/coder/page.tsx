import { redirect } from "next/navigation";

export default function RetiredCustomerCoderSettingsPage() {
  redirect("/dashboard?workspaceTab=code");
}
