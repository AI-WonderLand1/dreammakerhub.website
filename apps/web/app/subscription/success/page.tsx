import { redirect } from "next/navigation";

export const metadata = {
  title: 'Checkout status | AI WONDERLAND',
  description: 'Verify your payment status before assuming a subscription is active.',
};

// Historical return URLs do not contain a Stripe session ID, so they cannot
// establish payment success. The chooser displays an explicit unverified notice.
export default function SubscriptionSuccessPage() {
  redirect('/subscription?success=true');
}
