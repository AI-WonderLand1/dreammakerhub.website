'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageCircle, PlusCircle, Search, ThumbsUp, UserRound, Users, X } from 'lucide-react';
import { ensureSupabaseConfig, getSupabaseClient } from '@/lib/supabase/client';

type Category = 'announcements' | 'showcase' | 'q&a' | 'help' | 'general';
type Profile = { id: string; username: string | null; full_name: string | null; avatar_url: string | null; subscription_tier: string | null };
type Post = { id: string; author_id: string; title: string; content: string; category: Category; tags: string[]; created_at: string; author: Profile | null; upvotes: number; commentsCount: number; hasUpvoted: boolean };
type Comment = { id: string; post_id: string; author_id: string; content: string; created_at: string; author: Profile | null };

const categories: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All Discussions' }, { id: 'announcements', label: '📢 Announcements' }, { id: 'showcase', label: '✨ Showcase' },
  { id: 'q&a', label: '❓ Q&A' }, { id: 'help', label: '🆘 Help' }, { id: 'general', label: '💭 General' },
];
const nameOf = (p: Profile | null) => p?.full_name || p?.username || 'Community member';
const since = (iso: string) => { const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000)); if (s < 60) return 'just now'; const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; const d = Math.floor(h / 24); return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString(); };

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [category, setCategory] = useState<'all' | Category>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('general');
  const [tags, setTags] = useState('');
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reply, setReply] = useState('');

  const client = useCallback(async () => { await ensureSupabaseConfig(); return getSupabaseClient(); }, []);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const sb = await client(); if (!sb) { setError('Community database is unavailable.'); setLoading(false); return; }
    const { data: auth } = await sb.auth.getUser(); const uid = auth.user?.id ?? null; setUserId(uid);
    const [{ data: rows, error: e }, { count }] = await Promise.all([
      sb.from('community_posts').select('id,author_id,title,content,category,tags,created_at').order('created_at', { ascending: false }).limit(100),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
    ]);
    if (e) { setError(e.message); setLoading(false); return; }
    setMemberCount(count ?? 0);
    const postRows = rows ?? []; const ids = postRows.map(p => p.id); const authors = [...new Set(postRows.map(p => p.author_id))];
    const [pr, vr, cr] = await Promise.all([
      authors.length ? sb.from('profiles').select('id,username,full_name,avatar_url,subscription_tier').in('id', authors) : Promise.resolve({ data: [] }),
      ids.length ? sb.from('community_votes').select('post_id,user_id').in('post_id', ids) : Promise.resolve({ data: [] }),
      ids.length ? sb.from('community_comments').select('post_id').in('post_id', ids) : Promise.resolve({ data: [] }),
    ]);
    const profiles = new Map(((pr.data ?? []) as Profile[]).map(p => [p.id, p])); const votes = (vr.data ?? []) as { post_id: string; user_id: string }[]; const replies = (cr.data ?? []) as { post_id: string }[];
    setPosts(postRows.map(p => ({ ...p, category: p.category as Category, tags: Array.isArray(p.tags) ? p.tags : [], author: profiles.get(p.author_id) ?? null, upvotes: votes.filter(v => v.post_id === p.id).length, commentsCount: replies.filter(r => r.post_id === p.id).length, hasUpvoted: !!uid && votes.some(v => v.post_id === p.id && v.user_id === uid) })));
    setLoading(false);
  }, [client]);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => posts.filter(p => (category === 'all' || p.category === category) && (!search.trim() || [p.title, p.content, ...p.tags, nameOf(p.author)].join(' ').toLowerCase().includes(search.toLowerCase()))), [posts, category, search]);

  const createPost = async (e: FormEvent) => { e.preventDefault(); if (!userId || !title.trim() || !content.trim()) return; const sb = await client(); if (!sb) return; const { error: err } = await sb.from('community_posts').insert({ author_id: userId, title: title.trim(), content: content.trim(), category: newCategory, tags: tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 8) }); if (err) return setError(err.message); setComposer(false); setTitle(''); setContent(''); setTags(''); await load(); };
  const vote = async (p: Post) => { if (!userId) return; const sb = await client(); if (!sb) return; const q = p.hasUpvoted ? await sb.from('community_votes').delete().eq('post_id', p.id).eq('user_id', userId) : await sb.from('community_votes').insert({ post_id: p.id, user_id: userId }); if (q.error) return setError(q.error.message); setPosts(xs => xs.map(x => x.id === p.id ? { ...x, hasUpvoted: !x.hasUpvoted, upvotes: x.upvotes + (x.hasUpvoted ? -1 : 1) } : x)); };
  const loadComments = async (postId: string) => { setOpenPost(postId); const sb = await client(); if (!sb) return; const { data: rows, error: err } = await sb.from('community_comments').select('id,post_id,author_id,content,created_at').eq('post_id', postId).order('created_at'); if (err) return setError(err.message); const authors = [...new Set((rows ?? []).map(r => r.author_id))]; const { data: ps } = authors.length ? await sb.from('profiles').select('id,username,full_name,avatar_url,subscription_tier').in('id', authors) : { data: [] }; const map = new Map(((ps ?? []) as Profile[]).map(p => [p.id, p])); setComments((rows ?? []).map(r => ({ ...r, author: map.get(r.author_id) ?? null }))); };
  const addReply = async (e: FormEvent) => { e.preventDefault(); if (!userId || !openPost || !reply.trim()) return; const sb = await client(); if (!sb) return; const { error: err } = await sb.from('community_comments').insert({ post_id: openPost, author_id: userId, content: reply.trim() }); if (err) return setError(err.message); setReply(''); await loadComments(openPost); setPosts(xs => xs.map(x => x.id === openPost ? { ...x, commentsCount: x.commentsCount + 1 } : x)); };

  return <main className="min-h-screen bg-[#050508] text-slate-200"><div className="mx-auto max-w-7xl border-x border-white/10 min-h-screen">
    <header className="border-b border-white/10 bg-black/40 px-6 py-7"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><Users className="h-6 w-6 text-violet-400" />DreamMakerHub Community</h1><p className="mt-1 text-sm text-zinc-400">Public to read. Members can post, reply, and vote.</p></div>{userId ? <button onClick={() => setComposer(true)} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><PlusCircle className="h-4 w-4" />Create discussion</button> : <Link href="/auth/login?next=/community" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Sign in to post</Link>}</div><div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/5 pt-5 text-center"><Stat n={memberCount} label="Members" /><Stat n={posts.length} label="Discussions" /><Stat n={posts.reduce((n,p)=>n+p.commentsCount,0)} label="Replies" /></div></header>
    {error && <div className="m-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-12"><aside className="space-y-4 lg:col-span-3"><div className="rounded-xl border border-white/10 p-4"><div className="space-y-1">{categories.map(c => <button key={c.id} onClick={()=>setCategory(c.id)} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${category===c.id?'bg-violet-500/15 text-violet-300':'text-zinc-400 hover:bg-white/5'}`}>{c.label}</button>)}</div></div><Link href="/blog" className="block rounded-xl border border-violet-500/20 bg-violet-500/5 p-4"><div className="font-semibold text-white">DreamMakerHub Blog</div><div className="mt-1 text-xs text-zinc-400">Public articles. No membership required to read.</div></Link></aside>
      <section className="lg:col-span-9"><div className="mb-4 flex items-center rounded-xl border border-white/10 px-3"><Search className="h-4 w-4 text-zinc-500"/><input className="w-full bg-transparent px-3 py-3 text-sm outline-none" placeholder="Search discussions" value={search} onChange={e=>setSearch(e.target.value)}/></div>{loading ? <div className="flex min-h-64 items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Loading community…</div> : visible.length===0 ? <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-zinc-500">No discussions yet. The demo posts are gone.</div> : <div className="space-y-3">{visible.map(p => <article key={p.id} className="rounded-xl border border-white/10 bg-zinc-950/50 p-5"><div className="flex gap-3"><Avatar p={p.author}/><div className="min-w-0 flex-1"><div className="text-xs text-zinc-500"><span className="font-medium text-zinc-300">{nameOf(p.author)}</span> · {since(p.created_at)}</div><h2 className="mt-2 text-lg font-semibold text-white">{p.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{p.content}</p>{p.tags.length>0&&<div className="mt-3 flex flex-wrap gap-2">{p.tags.map(t=><span key={t} className="rounded bg-white/5 px-2 py-1 text-[11px] text-zinc-500">#{t}</span>)}</div>}<div className="mt-4 flex gap-3"><button disabled={!userId} onClick={()=>void vote(p)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${p.hasUpvoted?'bg-violet-500/15 text-violet-300':'text-zinc-500'} disabled:opacity-50`}><ThumbsUp className="h-4 w-4"/>{p.upvotes}</button><button onClick={()=>void loadComments(p.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500"><MessageCircle className="h-4 w-4"/>{p.commentsCount}</button></div></div></div></article>)}</div>}</section></div></div>
    {composer&&userId&&<Modal title="Create discussion" close={()=>setComposer(false)}><form onSubmit={createPost} className="space-y-4"><input required minLength={3} maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"/><select value={newCategory} onChange={e=>setNewCategory(e.target.value as Category)} className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5">{categories.filter(c=>c.id!=='all').map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select><textarea required maxLength={10000} rows={7} value={content} onChange={e=>setContent(e.target.value)} placeholder="What do you want to share or ask?" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"/><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Tags, comma separated" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"/><button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Publish discussion</button></form></Modal>}
    {openPost&&<Modal title="Replies" close={()=>setOpenPost(null)}><div className="space-y-3">{comments.length===0&&<div className="py-6 text-center text-sm text-zinc-500">No replies yet.</div>}{comments.map(c=><div key={c.id} className="rounded-lg border border-white/10 p-3"><div className="text-xs text-zinc-500"><span className="text-zinc-300">{nameOf(c.author)}</span> · {since(c.created_at)}</div><p className="mt-2 text-sm text-zinc-300">{c.content}</p></div>)}{userId?<form onSubmit={addReply} className="border-t border-white/10 pt-4"><textarea required maxLength={5000} value={reply} onChange={e=>setReply(e.target.value)} rows={3} placeholder="Write a reply" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"/><button className="mt-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white">Post reply</button></form>:<Link href="/auth/login?next=/community" className="block border-t border-white/10 pt-4 text-sm text-violet-300">Sign in to reply</Link>}</div></Modal>}
  </main>;
}
function Stat({n,label}:{n:number;label:string}){return <div><div className="text-2xl font-bold text-white">{n.toLocaleString()}</div><div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div></div>}
function Avatar({p}:{p:Profile|null}){return p?.avatar_url?<img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover"/>:<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5"><UserRound className="h-4 w-4 text-zinc-500"/></div>}
function Modal({title,children,close}:{title:string;children:React.ReactNode;close:()=>void}){return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0b10] p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{title}</h2><button onClick={close}><X className="h-5 w-5"/></button></div>{children}</div></div>}
