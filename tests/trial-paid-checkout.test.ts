import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only',()=>({}));
const state=vi.hoisted(()=>({create:vi.fn(),customer:vi.fn()}));
vi.mock('@/lib/billing/plans',()=>({PLANS:{
  free:{id:'free',price:0},trial:{id:'trial',price:0},
  creator:{id:'creator',price:1900,yearlyPrice:19000,stripePriceId:'price_creator',stripeProductId:'prod_creator'},
}}));
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'account-1',email:'member@example.com'}},error:null})}})}));
vi.mock('@/lib/billing/stripe-customer.server',()=>({resolveStripeCustomer:(...args:unknown[])=>state.customer(...args)}));
vi.mock('@/lib/stripe',()=>({stripe:{
  prices:{retrieve:async()=>({id:'price_creator',product:'prod_creator',active:true,type:'recurring',currency:'usd',unit_amount:1900,recurring:{interval:'month',interval_count:1,usage_type:'licensed'}})},
  checkout:{sessions:{create:(...args:unknown[])=>state.create(...args)}},
}}));
const {POST}=await import('@/app/api/subscription/subscribe/route');
beforeEach(()=>{
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','public-test-key');
  vi.stubEnv('NEXT_PUBLIC_URL','https://dreammakerhub.website');
  state.customer.mockReset().mockResolvedValue({customerId:'cus_existing'});
  state.create.mockReset().mockResolvedValue({id:'cs_test',url:'https://checkout.stripe.com/test'});
});
const request=(plan:string)=>new NextRequest('https://dreammakerhub.website/api/subscription/subscribe',{method:'POST',headers:{authorization:'Bearer session','content-type':'application/json'},body:JSON.stringify({plan,interval:'month'})});
describe('separate trial enrollment and paid Stripe checkout',()=>{
  it.each(['free','trial'])('does not create Stripe subscriptions for %s access',async(plan)=>{
    expect((await POST(request(plan))).status).toBe(400);
    expect(state.create).not.toHaveBeenCalled();
    expect(state.customer).not.toHaveBeenCalled();
  });
  it('uses the existing customer and requires explicit paid checkout without an automatic trial',async()=>{
    expect((await POST(request('creator'))).status).toBe(200);
    const options=state.create.mock.calls[0][0];
    expect(options).toMatchObject({customer:'cus_existing',payment_method_collection:'always',mode:'subscription',line_items:[{price:'price_creator',quantity:1}]});
    expect(options).not.toHaveProperty('customer_email');
    expect(options.subscription_data).not.toHaveProperty('trial_period_days');
    expect(options.subscription_data).not.toHaveProperty('trial_end');
  });
});
