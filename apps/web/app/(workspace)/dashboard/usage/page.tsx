import { BillingAccountSections } from "@/components/billing/BillingAccountSections";

export default function BillingOverviewPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing overview</h1>
        <p className="mt-1 text-sm text-white/50">
          Subscription, current billed amount, and next payment for your account.
        </p>
      </div>
      <BillingAccountSections section="overview" />
    </div>
  );
}
