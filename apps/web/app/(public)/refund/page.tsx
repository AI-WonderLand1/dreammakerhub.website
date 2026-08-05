import { logger } from '@/lib/logger';
// app/refund/page.tsx
export const metadata = {
  title: 'Refund and Return Policy | AI Wonderland',
  description: 'AI Wonderland refund and return policy.',
};

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Refund and Return Policy</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose lg:prose-xl">
        <h2>Subscription Refunds</h2>
        <p>We offer a 7-day money-back guarantee for all new subscription plans. If you're not satisfied with your subscription within the first 7 days, you can request a full refund.</p>

        <h2>Refund Process</h2>
        <p>To request a refund, please contact our support team at support@ai-wonderland.com with your order details. Refunds are processed within 5-7 business days and will be credited back to your original payment method.</p>

        <h2>No-Questions-Asked Guarantee</h2>
        <p>All subscriptions include our unconditional guarantee. You may cancel your subscription at any time and will not be charged for the current billing period. Your access continues until the end of the paid period.</p>

        <h2>Continuous Service</h2>
        <p>Once your paid subscription period expires, you will continue to have access to the basic functionality of your plan for 7 days as a grace period. After that, you will need to renew your subscription to continue access.</p>

        <h2>Enterprise Subscriptions</h2>
        <p>For enterprise subscriptions, refunds are handled on a case-by-case basis. Please contact our sales team at enterprise@ai-wonderland.com for custom refund arrangements.</p>

        <h2>Technical Issues</h2>
        <p>If you're experiencing technical difficulties that prevent you from using AI-Wonderland despite having an active subscription, please contact support immediately. We will provide either a service credit or refund if the issue cannot be resolved within 72 hours.</p>
      </div>
    </div>
  );
}
