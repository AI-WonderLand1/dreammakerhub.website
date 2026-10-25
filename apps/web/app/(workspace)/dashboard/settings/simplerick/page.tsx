import { redirect } from "next/navigation";

export default function LegacySimpleRickSettingsPage() {
  redirect("/dashboard/settings/agents");
}
