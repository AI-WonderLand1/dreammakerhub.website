"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Box, Coins, Database, FolderKanban, Key, RefreshCw, Zap } from "lucide-react";
import { createClient, ensureSupabaseConfig } from "@/lib/supabase/client";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import { formatBytes, formatNumber, PLAN_LIMITS } from "@/lib/billing/limits";

type PlanName = keyof typeof PLAN_LIMITS;
type UsageActivity = {
  action:string;
  source?:string;
  tokens_used:number;
  api_calls:number;
  render_credits_used?:number;
  runtime_minutes?:number;
  created_at:string;
};
type SourceUsage = { ai_tokens:number; api_requests:number; render_credits:number };
type UsageSummary = {
  plan:string;
  api_calls_used:number;
  tokens_used:number;
  storage_used:number;
  purchased_tokens:number;
  purchased_render_credits:number;
  render_credits_used:number;
  three_d_generations:number;
  period_start:string;
  period_reset:string;
  by_source:Record<string,SourceUsage>;
  recent_activity:UsageActivity[];
};
type ApiKeyRow = { id:string; name:string; prefix:string; last_used_at:string|null; revoked_at:string|null };
type TokenPack = { id:string; label:string; tokens:number; available:boolean; amount:number|null; currency:string|null };
const normalizePlan=(value:unknown):PlanName=>{
  const plan=typeof value==="string"?value.toLowerCase():"free";
  return plan==="pro"||plan==="team"||plan==="enterprise"?plan:"free";
};
const pct=(used:number,limit:number)=>limit?Math.min(100,Math.round((used/limit)*100)):0;
const pretty=(value:string)=>value.replace(/[_.-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const ago=(iso:string)=>{
  const s=Math.max(1,Math.floor((Date.now()-new Date(iso).getTime())/1000));
  if(s<60)return `${s}s ago`;
  if(s<3600)return `${Math.floor(s/60)}m ago`;
  if(s<86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

export default function BillingLiveUsagePanel({view}:{view:"usage"|"ai"|"licensing"}) {
  const [plan,setPlan]=useState<PlanName>("free");
  const [usage,setUsage]=useState<UsageSummary|null>(null);
  const [apiKeys,setApiKeys]=useState<ApiKeyRow[]>([]);
  const [tokenPacks,setTokenPacks]=useState<TokenPack[]>([]);
  const [projectCount,setProjectCount]=useState(0);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [live,setLive]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [buyingPack,setBuyingPack]=useState<string|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const load=useCallback(async()=>{
    setRefreshing(true); setError(null);
    try{
      const [ur,kr,pr,tr]=await Promise.all([
        fetch("/api/usage",{credentials:"same-origin",cache:"no-store"}),
        fetch("/api/keys",{credentials:"same-origin",cache:"no-store"}),
        fetchAuthenticatedProject("/api/projects"),
        fetch("/api/billing/token-packs",{credentials:"same-origin",cache:"no-store"}),
      ]);
      const [u,k,p,t]=await Promise.all([ur.json().catch(()=>({})),kr.json().catch(()=>({})),pr.json().catch(()=>({})),tr.json().catch(()=>({}))]);
      if(!ur.ok||!u?.usage)throw new Error(u?.error||"Live usage could not be loaded.");
      if(!kr.ok)throw new Error(k?.error||"API keys could not be loaded.");
      if(!pr.ok||!Array.isArray(p?.projects))throw new Error("Projects could not be loaded.");
      setUsage(u.usage as UsageSummary);
      setPlan(normalizePlan(u.usage.plan));
      setApiKeys(Array.isArray(k?.keys)?k.keys:[]);
      setProjectCount(p.projects.length);
      setTokenPacks(Array.isArray(t?.packs)?t.packs.filter((pack:TokenPack)=>pack.available):[]);
    }catch(cause){setError(cause instanceof Error?cause.message:"Failed to load billing data.");}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{void load();},[load]);

  useEffect(()=>{
    let channel:any=null; let cancelled=false; let supabase:any=null;
    void (async()=>{
      const config=await ensureSupabaseConfig();
      if(cancelled||!config)return;
      supabase=createClient();
      if(!supabase)return;
      const {data}=await supabase.auth.getUser();
      if(cancelled||!data.user)return;
      const refresh=()=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void load(),500);};
      channel=supabase.channel(`billing:${data.user.id}`)
        .on("postgres_changes",{event:"*",schema:"public",table:"usage_logs",filter:`user_id=eq.${data.user.id}`},refresh)
        .on("postgres_changes",{event:"*",schema:"public",table:"user_token_balances",filter:`user_id=eq.${data.user.id}`},refresh)
        .on("postgres_changes",{event:"*",schema:"public",table:"cross_repo_usage_events",filter:`user_id=eq.${data.user.id}`},refresh)
        .subscribe((status:string)=>setLive(status==="SUBSCRIBED"));
    })();
    return()=>{cancelled=true;if(timer.current)clearTimeout(timer.current);if(channel&&supabase)void supabase.removeChannel(channel);};
  },[load]);

  const buy=async(id:string)=>{
    setBuyingPack(id);setError(null);
    try{
      const response=await fetch("/api/billing/token-packs",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({pack:id})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||!payload?.url)throw new Error(payload?.error||"Could not start token checkout.");
      window.location.assign(payload.url);
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not start token checkout.");setBuyingPack(null);}
  };

  if(loading)return <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/50">Loading live billing data…</div>;

  const limits=PLAN_LIMITS[plan];
  const tokens=Number(usage?.tokens_used??0);
  const api=Number(usage?.api_calls_used??0);
  const storage=Number(usage?.storage_used??0);
  const purchased=Number(usage?.purchased_tokens??0);
  const threeD=Number(usage?.three_d_generations??0);
  const tokenPct=pct(tokens,limits.aiTokensMonthly), apiPct=pct(api,limits.apiCallsMonthly), storagePct=pct(storage,limits.storageLimit);
  const activeKeys=apiKeys.filter(k=>!k.revoked_at);
  const sourceUsage=Object.entries(usage?.by_source??{});
  const sourceLabel=(source:string)=>source==="dreammakerhub"?"DreamMakerHub":source==="ai-playground"?"AI Playground":source==="npc-ai-sim"?"NPC AI SIM":pretty(source);

  const titles={usage:["Usage","Live metered usage for the current billing period."],ai:["AI usage","AI token consumption and purchased token balance."],licensing:["Licensing","Your active plan limits and included allowances."]} as const;
  const title=titles[view];

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{title[0]}</h1><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${live?"border-emerald-400/30 bg-emerald-500/10 text-emerald-300":"border-white/10 bg-white/5 text-white/40"}`}>{live?"Live":"Connected"}</span></div><p className="mt-1 text-sm text-white/50">{title[1]}</p></div>
      <button type="button" onClick={()=>void load()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"><RefreshCw size={14} className={refreshing?"animate-spin":""}/>Refresh</button>
    </div>
    {error&&<div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

    {view==="usage"&&<>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["AI Tokens",formatNumber(tokens),formatNumber(limits.aiTokensMonthly),tokenPct,Zap],
          ["API Requests",formatNumber(api),formatNumber(limits.apiCallsMonthly),apiPct,ArrowUpRight],
          ["Projects",String(projectCount),String(limits.projectsLimit),pct(projectCount,limits.projectsLimit),FolderKanban],
          ["Storage",formatBytes(storage),formatBytes(limits.storageLimit),storagePct,Database],
          ["3D Generations",formatNumber(threeD),"metered",0,Box],
        ].map(([label,used,limit,value,Icon])=><div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="mb-2 flex items-center gap-2 text-sm text-white/50"><Icon size={14}/>{label}</div><div className="text-2xl font-bold">{used}<span className="text-sm font-normal text-white/45"> / {limit}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-500" style={{width:`${value}%`}}/></div></div>)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">Current billing period</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-white/55">AI tokens</span><span>{formatNumber(tokens)}</span></div><div className="flex justify-between"><span className="text-white/55">API requests</span><span>{formatNumber(api)}</span></div><div className="flex justify-between"><span className="text-white/55">Storage</span><span>{formatBytes(storage)}</span></div>{usage?.period_start&&<div className="flex justify-between"><span className="text-white/55">Started</span><span>{new Date(usage.period_start).toLocaleDateString()}</span></div>}{usage?.period_reset&&<div className="flex justify-between"><span className="text-white/55">Resets</span><span>{new Date(usage.period_reset).toLocaleDateString()}</span></div>}</div></section>
        <section className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-2"><Key size={15} className="text-cyan-300"/><h2 className="font-semibold">API keys</h2></div><div className="mt-4 space-y-2">{activeKeys.slice(0,6).map(key=><div key={key.id} className="flex items-center justify-between gap-3 text-sm"><div><div>{key.name}</div><div className="text-xs text-white/35">{key.last_used_at?`Last used ${ago(key.last_used_at)}`:"Never used"}</div></div><code className="text-xs text-white/40">{key.prefix}</code></div>)}{activeKeys.length===0&&<p className="text-sm text-white/40">No active API keys.</p>}</div></section>
      </div>
      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-semibold">Usage by service</h2>
        <p className="mt-1 text-xs text-white/40">One billing account across DreamMakerHub, AI Playground, and NPC AI SIM.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {sourceUsage.map(([source,totals])=><div key={source} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="font-medium">{sourceLabel(source)}</div>
            <div className="mt-3 space-y-1 text-xs text-white/55">
              <div className="flex justify-between"><span>AI tokens</span><span>{formatNumber(Number(totals.ai_tokens||0))}</span></div>
              <div className="flex justify-between"><span>API requests</span><span>{formatNumber(Number(totals.api_requests||0))}</span></div>
              <div className="flex justify-between"><span>3D/render</span><span>{formatNumber(Number(totals.render_credits||0))}</span></div>
            </div>
          </div>)}
          {sourceUsage.length===0&&<div className="text-sm text-white/40">No metered service usage yet this billing period.</div>}
        </div>
      </section>
      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">Recent metered activity</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-white/10 text-left text-white/45"><th className="py-2">Service</th><th className="py-2">Action</th><th className="py-2 text-right">API</th><th className="py-2 text-right">Tokens / credits</th><th className="py-2 text-right">When</th></tr></thead><tbody className="divide-y divide-white/5">{(usage?.recent_activity??[]).map((row,index)=><tr key={`${row.created_at}-${index}`}><td className="py-2">{sourceLabel(row.source||"dreammakerhub")}</td><td className="py-2">{pretty(row.action)}</td><td className="py-2 text-right">{row.api_calls}</td><td className="py-2 text-right">{formatNumber(row.tokens_used||row.render_credits_used||0)}</td><td className="py-2 text-right text-white/40">{ago(row.created_at)}</td></tr>)}{(usage?.recent_activity??[]).length===0&&<tr><td colSpan={5} className="py-6 text-center text-white/35">No metered activity this billing period.</td></tr>}</tbody></table></div></section>
    </>}

    {view==="ai"&&<>
      <div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4"><div className="text-sm text-white/50">Included tokens used</div><div className="mt-2 text-3xl font-bold">{formatNumber(tokens)}</div></div><div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4"><div className="text-sm text-white/50">Included allowance</div><div className="mt-2 text-3xl font-bold">{formatNumber(limits.aiTokensMonthly)}</div></div><div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4"><div className="text-sm text-white/50">Purchased token balance</div><div className="mt-2 text-3xl font-bold">{formatNumber(purchased)}</div></div></div>
      {tokenPacks.length>0&&<section className="mt-6 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4"><div className="flex items-center gap-2 text-violet-200"><Coins size={17}/><h2 className="font-semibold">Buy AI tokens</h2></div><div className="mt-4 grid gap-3 md:grid-cols-3">{tokenPacks.map(pack=><div key={pack.id} className="rounded-lg border border-white/10 bg-black/20 p-4"><div className="font-medium">{pack.label}</div><div className="mt-1 text-2xl font-bold">{formatNumber(pack.tokens)}</div><div className="mt-1 text-xs text-white/45">{pack.amount!==null&&pack.currency?new Intl.NumberFormat(undefined,{style:"currency",currency:pack.currency.toUpperCase()}).format(pack.amount/100):""}</div><button type="button" onClick={()=>void buy(pack.id)} disabled={buyingPack!==null} className="mt-4 w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold disabled:opacity-50">{buyingPack===pack.id?"Opening checkout…":"Buy tokens"}</button></div>)}</div></section>}
    </>}

    {view==="licensing"&&<section className="rounded-xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">Active plan: <span className="capitalize">{plan}</span></h2><div className="mt-4 grid gap-3 text-sm md:grid-cols-2"><div className="flex justify-between"><span className="text-white/60">Projects</span><span>{limits.projectsLimit}</span></div><div className="flex justify-between"><span className="text-white/60">AI tokens / month</span><span>{formatNumber(limits.aiTokensMonthly)}</span></div><div className="flex justify-between"><span className="text-white/60">API requests / month</span><span>{formatNumber(limits.apiCallsMonthly)}</span></div><div className="flex justify-between"><span className="text-white/60">Storage allowance</span><span>{formatBytes(limits.storageLimit)}</span></div></div><Link href="/subscription" className="mt-5 inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold">View plans</Link></section>}
  </div>;
}
