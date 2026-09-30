import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("same-page DreamMakerHub billing",()=>{
  it("edits billing identity and address inside the payment-information page",()=>{
    const page=read("apps/web/components/billing/BillingAccountSections.tsx");
    const editor=read("apps/web/components/billing/InlineBillingEditor.tsx");
    expect(page).toContain("<InlineBillingEditor");
    expect(editor).toContain('method: "PATCH"');
    expect(editor).toContain('fetch("/api/billing/account"');
    expect(editor).toContain("Save billing information");
    expect(editor).toContain("State / region");
    expect(editor).toContain("ZIP / postal code");
    expect(editor).toContain("Country code");
  });

  it("uses Stripe Payment Element + SetupIntent without sending raw payment data to DreamMakerHub",()=>{
    const editor=read("apps/web/components/billing/InlineBillingEditor.tsx");
    const setup=read("apps/web/app/api/billing/payment-method/setup-intent/route.ts");
    const save=read("apps/web/app/api/billing/payment-method/default/route.ts");
    expect(editor).toContain("https://js.stripe.com/v3/");
    expect(editor).toContain('elements.create("payment"');
    expect(editor).toContain("elements.submit()");
    expect(editor).toContain("confirmSetup");
    expect(editor).toContain('fetch("/api/billing/payment-method/default"');
    expect(editor).toContain("payment_method_data");
    expect(editor).toContain("billing_details");
    expect(setup).toContain("stripe.setupIntents.create");
    expect(setup).toContain('payment_method_types: ["card"]');
    expect(save).toContain("setupIntents.retrieve(setupIntentId)");
    expect(save).toContain("paymentMethods.retrieve(paymentMethodId)");
    expect(save).toContain('setupIntent.status !== "succeeded"');
    expect(save).toContain("setupPaymentMethod !== paymentMethodId");
    expect(save).toContain("setupIntent.metadata?.dreammakerhubUserId !== user.id");
    expect(save).toContain("default_payment_method: paymentMethodId");
    expect(save).not.toContain("card.number");
    expect(save).not.toContain("cvc");
  });

  it("keeps normal billing management in DreamMakerHub instead of redirecting to the Stripe portal",()=>{
    const page=read("apps/web/components/billing/BillingAccountSections.tsx");
    expect(page).not.toContain("BillingPortalButton");
    expect(page).not.toContain('fetch("/api/subscription/portal"');
    expect(page).not.toContain("Manage in Stripe");
    expect(page).toContain('href="/subscription"');
    expect(page).toContain("Manage plan");
  });

  it("shows whether a saved card is debit, credit, or another Stripe funding type",()=>{
    const account=read("apps/web/app/api/billing/account/route.ts");
    const page=read("apps/web/components/billing/InlineBillingEditor.tsx");
    expect(account).toContain("funding: defaultMethod.card.funding");
    expect(page).toContain('paymentMethod.funding || "card"');
  });

  it("allows Stripe network traffic required by the embedded secure field",()=>{
    const config=read("apps/web/next.config.mjs");
    expect(config).toContain("https://js.stripe.com");
    expect(config).toContain("https://api.stripe.com");
    expect(config).toContain("https://m.stripe.network");
  });
});
