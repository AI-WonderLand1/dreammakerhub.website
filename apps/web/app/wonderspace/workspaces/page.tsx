import { redirect } from "next/navigation";

export default function RetiredIdeRoute() {
  redirect("/dashboard?workspaceTab=code");
}
