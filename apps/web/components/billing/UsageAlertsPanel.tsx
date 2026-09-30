"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Mail, MessageSquareText, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { createClient, ensureSupabaseConfig } from "@/lib/supabase/client";
import { formatBytes, formatNumber, PLAN_LIMITS } from "@/lib/billing/limits";

type Metric = "ai_tokens" | "api_requests" | "storage" | "three_d_generations";
type Channel = "in_app" | "email" | "sms";

type AlertRow = {
  id: string;
  metric: Metric;
  threshold_kind: "percent" | "absolute";
  threshold_value: number | string;
  channels: Channel[];
  destination_email: string | null;
  destination_phone: string | null;
  enabled: boolean;
  last_triggered_period_start: string | null;
  last_triggered_value: number | string | null;
  last_delivery_status: Record<string, string> | null;
};

type Usage = {
  plan: string;
  tokens_used: number;
  api_calls_used: number;
  storage_used: number;
  three_d_generations: number;
};

type Providers = { email: boolean; sms: boolean };

const labels: Record<Metric,string> = {
  ai_tokens: "AI tokens",
  api_requests: "API requests",
  storage: "Storage",
  three_d_generations: "3D generations",
};

const emptyForm = {
  id: "",
  metric: "ai_tokens" as Metric,
  threshold_value: 80,
  channels: ["in_app"] as Channel[],
  destination_email: "",
  destination_phone: "",
  enabled: true,
};

export default function UsageAlertsPanel() {
  const [alerts,setAlerts]=useState<AlertRow[]>([]);
  const [usage,setUsage]=useState<Usage|null>(null);
  const [providers,setProviders]=useState<Providers>({email:false,sms:false});
  const [defaultEmail,setDefaultEmail]=useState("");
  const [form,setForm]=useState(emptyForm);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [live,setLive]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const load=useCallback(async()=>{
    setError(null);
    try{
      const [usageResponse,alertsResponse]=await Promise.all([
        fetch("/api/usage",{credentials:"same-origin",cache:"no-store"}),
        fetch("/api/billing/alerts",{credentials:"same-origin",cache:"no-store"}),
      ]);
      const [usagePayload,alertsPayload]=await Promise.all([
        usageResponse.json().catch(()=>({})),
        alertsResponse.json().catch(()=>({})),
      ]);
      if(!usageResponse.ok||!usagePayload?.usage)throw new Error(usagePayload?.error||"Could not load live usage.");
      if(!alertsResponse.ok)throw new Error(alertsPayload?.error||"Could not load alarms.");
      setUsage(usagePayload.usage as Usage);
      setAlerts(Array.isArray(alertsPayload?.alerts)?alertsPayload.alerts:[]);
      setProviders(alertsPayload?.providers||{email:false,sms:false});
      setDefaultEmail(alertsPayload?.defaultEmail||"");
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Could not load usage alarms.");
    }finally{
      setLoading(false);
    }
  },[]);

  useEffect(()=>{void load();},[load]);

  useEffect(()=>{
    let cancelled=false;
    let cleanup=()=>{};
    void (async()=>{
      const config=await ensureSupabaseConfig();
      if(cancelled||!config)return;
      const supabase=createClient();
      if(!supabase)return;
      const {data}=await supabase.auth.getUser();
      if(cancelled||!data.user)return;
      const refresh=()=>void load();
      const channel=supabase.channel(`billing-alerts:${data.user.id}`)
        .on("postgres_changes",{event:"*",schema:"public",table:"usage_logs",filter:`user_id=eq.${data.user.id}`},refresh)
        .on("postgres_changes",{event:"*",schema:"public",table:"user_usage_alerts",filter:`user_id=eq.${data.user.id}`},refresh)
        .subscribe(status=>setLive(status==="SUBSCRIBED"));
      cleanup=()=>{setLive(false);void supabase.removeChannel(channel);};
    })();
    return()=>{cancelled=true;cleanup();};
  },[load]);

  const plan=useMemo(()=>{
    const value=usage?.plan?.toLowerCase();
    return value==="pro"||value==="team"||value==="enterprise"?value:"free";
  },[usage?.plan]);
  const limits=PLAN_LIMITS[plan];

  const metricCurrent=(metric:Metric)=>{
    if(!usage)return 0;
    if(metric==="ai_tokens")return Number(usage.tokens_used||0);
    if(metric==="api_requests")return Number(usage.api_calls_used||0);
    if(metric==="storage")return Number(usage.storage_used||0);
    return Number(usage.three_d_generations||0);
  };

  const measured=(alert:AlertRow)=>{
    const current=metricCurrent(alert.metric);
    if(alert.threshold_kind==="absolute")return current;
    const limit=alert.metric==="ai_tokens"?limits.aiTokensMonthly:
      alert.metric==="api_requests"?limits.apiCallsMonthly:
      alert.metric==="storage"?limits.storageLimit:0;
    return limit?current/limit*100:0;
  };

  const active=alerts.filter(alert=>alert.enabled&&measured(alert)>=Number(alert.threshold_value));

  const beginAdd=()=>{
    setForm({...emptyForm,destination_email:defaultEmail});
    setShowForm(true);
  };

  const beginEdit=(alert:AlertRow)=>{
    setForm({
      id:alert.id,
      metric:alert.metric,
      threshold_value:Number(alert.threshold_value),
      channels:Array.isArray(alert.channels)?alert.channels:["in_app"],
      destination_email:alert.destination_email||defaultEmail,
      destination_phone:alert.destination_phone||"",
      enabled:alert.enabled,
    });
    setShowForm(true);
  };

  const toggleChannel=(channel:Channel)=>{
    setForm(current=>{
      const has=current.channels.includes(channel);
      const channels=has?current.channels.filter(item=>item!==channel):[...current.channels,channel];
      return {...current,channels:channels.length?channels:["in_app"]};
    });
  };

  const save=async()=>{
    setSaving(true);setError(null);
    try{
      const response=await fetch("/api/billing/alerts",{
        method:form.id?"PATCH":"POST",
        headers:{"Content-Type":"application/json"},
        credentials:"same-origin",
        body:JSON.stringify(form),
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload?.error||"Could not save alarm.");
      setShowForm(false);
      setForm(emptyForm);
      await load();
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Could not save alarm.");
    }finally{
      setSaving(false);
    }
  };

  const remove=async(id:string)=>{
    setError(null);
    const response=await fetch(`/api/billing/alerts?id=${encodeURIComponent(id)}`,{
      method:"DELETE",credentials:"same-origin",
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok){setError(payload?.error||"Could not delete alarm.");return;}
    await load();
  };

  if(loading)return <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/50">Loading usage alarms…</div>;

  return <div>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Budgets & alerts</h1>
          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${live?"border-emerald-400/30 bg-emerald-500/10 text-emerald-300":"border-white/10 bg-white/5 text-white/40"}`}>{live?"Live":"Connected"}</span>
        </div>
        <p className="mt-1 text-sm text-white/50">Create usage alarms for AI, API, storage, and 3D generation activity.</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"><RefreshCw size={14}/>Refresh</button>
        <button type="button" onClick={beginAdd} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500"><Plus size={15}/>New alarm</button>
      </div>
    </div>

    {error&&<div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

    {active.length>0&&<div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 font-semibold text-amber-200"><Bell size={16}/>Active alarms</div>
      <div className="mt-2 space-y-1 text-sm text-white/65">
        {active.map(alert=><p key={alert.id}>{labels[alert.metric]} reached {alert.threshold_kind==="percent"?`${Math.round(measured(alert))}%`:`${metricCurrent(alert.metric)} generations`}.</p>)}
      </div>
    </div>}

    {showForm&&<section className="mb-5 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
      <div className="flex items-center justify-between"><h2 className="font-semibold">{form.id?"Edit alarm":"New alarm"}</h2><button type="button" onClick={()=>setShowForm(false)} className="text-sm text-white/50 hover:text-white">Cancel</button></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/60">Usage type
          <select value={form.metric} onChange={e=>setForm(v=>({...v,metric:e.target.value as Metric,threshold_value:e.target.value==="three_d_generations"?10:80}))} className="mt-1 w-full rounded-lg border border-white/15 bg-[#07111d] px-3 py-2 text-white">
            <option value="ai_tokens">AI tokens</option>
            <option value="api_requests">API requests</option>
            <option value="storage">Storage</option>
            <option value="three_d_generations">3D generations</option>
          </select>
        </label>
        <label className="text-sm text-white/60">{form.metric==="three_d_generations"?"Generation count":"Percent used"}
          <input type="number" min={1} max={form.metric==="three_d_generations"?1000000:100} value={form.threshold_value} onChange={e=>setForm(v=>({...v,threshold_value:Number(e.target.value)}))} className="mt-1 w-full rounded-lg border border-white/15 bg-[#07111d] px-3 py-2 text-white"/>
        </label>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium">Delivery</div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.channels.includes("in_app")} onChange={()=>toggleChannel("in_app")}/><Bell size={14}/>In app</label>
          {providers.email&&<label className="flex items-center gap-2"><input type="checkbox" checked={form.channels.includes("email")} onChange={()=>toggleChannel("email")}/><Mail size={14}/>Email</label>}
          {providers.sms&&<label className="flex items-center gap-2"><input type="checkbox" checked={form.channels.includes("sms")} onChange={()=>toggleChannel("sms")}/><MessageSquareText size={14}/>Text message</label>}
        </div>
      </div>

      {form.channels.includes("email")&&<label className="mt-4 block text-sm text-white/60">Alarm email
        <input type="email" value={form.destination_email} onChange={e=>setForm(v=>({...v,destination_email:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/15 bg-[#07111d] px-3 py-2 text-white"/>
      </label>}
      {form.channels.includes("sms")&&<label className="mt-4 block text-sm text-white/60">Text number
        <input type="tel" placeholder="+13125551234" value={form.destination_phone} onChange={e=>setForm(v=>({...v,destination_phone:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/15 bg-[#07111d] px-3 py-2 text-white"/>
      </label>}

      <button type="button" onClick={()=>void save()} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"><Save size={14}/>{saving?"Saving…":"Save alarm"}</button>
    </section>}

    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[.025]">
      <div className="border-b border-white/10 px-4 py-3 font-semibold">{alerts.length} usage alarm{alerts.length===1?"":"s"}</div>
      {alerts.length===0?<div className="p-6 text-sm text-white/45">No usage alarms configured.</div>:<div className="divide-y divide-white/10">
        {alerts.map(alert=>{
          const current=metricCurrent(alert.metric);
          const currentText=alert.metric==="storage"?formatBytes(current):formatNumber(current);
          const thresholdText=alert.threshold_kind==="percent"?`${alert.threshold_value}%`:`${alert.threshold_value} generations`;
          return <div key={alert.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
            <div><div className="text-xs text-white/40">Usage</div><div className="font-semibold">{labels[alert.metric]}</div><div className="text-xs text-white/45">Current: {currentText}</div></div>
            <div><div className="text-xs text-white/40">Threshold</div><div>{thresholdText}</div></div>
            <div><div className="text-xs text-white/40">Delivery</div><div className="capitalize">{(alert.channels||[]).map(channel=>channel==="sms"?"Text":channel.replace("_"," ")).join(", ")}</div></div>
            <div className="flex gap-2"><button type="button" onClick={()=>beginEdit(alert)} className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5">Edit</button><button type="button" onClick={()=>void remove(alert.id)} className="rounded-md border border-red-500/30 px-2 py-1.5 text-red-300 hover:bg-red-500/10" aria-label="Delete alarm"><Trash2 size={14}/></button></div>
          </div>;
        })}
      </div>}
    </section>
  </div>;
}
