"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileForm = { username:string; full_name:string; avatar_url:string; website:string };

export default function AccountSettingsPage() {
  const [form,setForm]=useState<ProfileForm>({username:"",full_name:"",avatar_url:"",website:""});
  const [email,setEmail]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  useEffect(()=>{
    const supabase=createClient();
    if(!supabase){setMessage("Account service is unavailable.");setLoading(false);return;}
    void supabase.auth.getUser().then(async({data,error})=>{
      if(error||!data.user){setMessage("Please sign in again.");setLoading(false);return;}
      setEmail(data.user.email||"");
      const {data:profile,error:profileError}=await supabase.from("profiles").select("username,full_name,avatar_url,website").eq("id",data.user.id).maybeSingle();
      if(profileError)setMessage(profileError.message);
      if(profile)setForm({username:profile.username||"",full_name:profile.full_name||"",avatar_url:profile.avatar_url||"",website:profile.website||""});
      setLoading(false);
    });
  },[]);

  const save=async()=>{
    const supabase=createClient(); if(!supabase)return;
    setSaving(true);setMessage(null);
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setMessage("Please sign in again.");setSaving(false);return;}
    const {error}=await supabase.from("profiles").update({...form,updated_at:new Date().toISOString()}).eq("id",user.id);
    setMessage(error?error.message:"Account profile saved.");
    setSaving(false);
  };

  if(loading)return <div className="text-sm text-white/50">Loading account…</div>;

  return <div className="max-w-2xl space-y-5">
    <div><h1 className="text-2xl font-bold">Account</h1><p className="mt-1 text-sm text-white/50">Manage the profile shown across your DreamMakerHub workspace.</p></div>
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
      <label className="block text-sm"><span className="mb-1 block text-white/60">Email</span><input value={email} disabled className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white/45"/></label>
      {([["full_name","Display name"],["username","Username"],["avatar_url","Avatar URL"],["website","Website"]] as const).map(([key,label])=><label key={key} className="block text-sm"><span className="mb-1 block text-white/60">{label}</span><input value={form[key]} onChange={e=>setForm(current=>({...current,[key]:e.target.value}))} className="w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 outline-none focus:border-violet-400/50"/></label>)}
      <button type="button" onClick={()=>void save()} disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">{saving?"Saving…":"Save profile"}</button>
      {message&&<p className="text-sm text-white/60">{message}</p>}
    </div>
  </div>;
}
