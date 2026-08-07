import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export const metadata = {
  title: 'Subscription Successful | AI Wonderland',
  description: 'Your AI Wonderland subscription is active.',
};

export default function SubscriptionSuccessPage() {
  redirect("/subscription?success=true");
}
