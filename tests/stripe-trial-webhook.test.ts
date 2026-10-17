import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
const state = vi.hoisted(() => ({ event: {} as any, subscription: {} as any,
  signatureValid: true, updates: [] as any[], rpc: vi.fn(), persisted: vi.fn(), retrieve: vi.fn() }));
vi.mock('@/lib/stripe', () => ({ stripe: {
  webhooks: { constructEvent: () => { if (!state.signatureValid) throw new Error('invalid'); return state.event; } },
  subscriptions: { retrieve: (...args: unknown[]) => state.retrieve(...args) },
} }));
vi.mock('@/lib/billing/stripe-catalog-price', () => ({ stripePriceMatchesPlan: (price: any, plan: any) => price.id === 'price_creator' && plan.id === 'creator' }));
vi.mock('@/lib/analytics/track-funnel-event.server', () => ({trackFunnelEvent: vi.fn()}));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  rpc: (...args: unknown[]) => state.rpc(...args),
  from: () => {
    const chain: any = {
      select: () => chain, eq: (...args: unknown[]) => { state.updates.push({filter: args}); return chain; },
      maybeSingle: async () => ({data: {user_id: 'account-1'}, error: null}),
      update: (data: unknown) => {state.updates.push(data); return chain;},
      upsert: (...args: unknown[]) => state.persisted(...args),
      then: (resolve: any) => Promise.resolve({error: null}).then(resolve),
    }; return chain;
  },
}) }));
vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'webhook-test-signing-key');
const { POST } = await import('@/app/api/webhooks/stripe/route');
const request = () => new NextRequest('http://localhost/api/webhooks/stripe', {method: 'POST', body: '{}', headers: {'stripe-signature': 'signed-event'}});
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://test.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','service-test');
  state.signatureValid=true; state.updates=[];
  state.rpc.mockReset().mockResolvedValue({error:null});
  state.persisted.mockReset().mockResolvedValue({error:null});
  state.subscription={id:'sub_current',customer:'cus_customer',status:'active',metadata:{userId:'account-1'},items:{data:[{price:{id:'price_creator',currency:'usd',type:'recurring',recurring:{interval:'month'}},quantity:1}]}};
  state.retrieve.mockReset().mockImplementation(async()=>state.subscription);
});
afterEach(()=>vi.unstubAllEnvs());
describe('Stripe reconciliation with one-time Supabase trials',()=>{
  it('recomputes remaining membership after cancellation without starting a trial',async()=>{
    state.event={type:'customer.subscription.deleted',data:{object:{id:'sub_current',customer:'cus_customer'}}};
    expect((await POST(request())).status).toBe(200);
    expect(state.rpc).toHaveBeenCalledExactlyOnceWith('refresh_account_membership',{p_user_id:'account-1'});
    expect(state.updates).toContainEqual(expect.objectContaining({status:'canceled'}));
  });
  it('uses current Stripe state when an old active event arrives after cancellation',async()=>{
    state.event={type:'customer.subscription.updated',data:{object:{id:'sub_current',status:'active'}}};
    state.subscription.status='canceled';
    expect((await POST(request())).status).toBe(200);
    expect(state.retrieve).toHaveBeenCalledWith('sub_current');
    expect(state.persisted).not.toHaveBeenCalled();
    expect(state.rpc).toHaveBeenCalledWith('refresh_account_membership',{p_user_id:'account-1'});
  });
  it('persists verified paid checkout updates before refreshing membership',async()=>{
    state.event={type:'customer.subscription.updated',data:{object:{id:'sub_current'}}};
    expect((await POST(request())).status).toBe(200);
    expect(state.persisted).toHaveBeenCalledWith(expect.objectContaining({plan:'creator',status:'active'}),expect.anything());
    expect(state.rpc).toHaveBeenCalledWith('refresh_account_membership',{p_user_id:'account-1'});
  });
  it('updates only the failed invoice subscription and uses its current status',async()=>{
    state.subscription.status='past_due';
    state.event={type:'invoice.payment_failed',data:{object:{customer:'cus_customer',parent:{subscription_details:{subscription:'sub_current'}}}}};
    expect((await POST(request())).status).toBe(200);
    expect(state.updates).toContainEqual({filter:['stripe_subscription_id','sub_current']});
    expect(state.updates).not.toContainEqual({filter:['stripe_customer_id','cus_customer']});
    expect(state.rpc).toHaveBeenCalledWith('refresh_account_membership',{p_user_id:'account-1'});
  });
  it('rejects an invalid signature before touching Supabase',async()=>{
    state.signatureValid=false;
    expect((await POST(request())).status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
    expect(state.updates).toEqual([]);
  });
});
