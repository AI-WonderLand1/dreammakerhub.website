'use client';

// Compatibility component for older imports. Keep authentication, plan selection,
// and Stripe checkout on one supported path instead of a second signup form with
// outdated prices or a client-side active-subscription write.
export { default } from '@/app/public-pages/auth/page';
