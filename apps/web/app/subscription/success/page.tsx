import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export default function SubscriptionSuccessPage() {
  redirect("/subscription?success=true");
}
