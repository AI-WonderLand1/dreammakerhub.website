import Link from 'next/link';
import { BookOpen, CalendarDays, ArrowRight } from 'lucide-react';

const posts = [
  {
    slug: 'why-im-building-dreammakerhub',
    title: "Why I'm Building DreamMakerHub",
    excerpt: 'A look at the idea behind DreamMakerHub: one place to create, edit, run, and publish projects with AI, visual tools, and a real development workspace.',
    date: 'September 15, 2026',
    category: 'Founder Notes',
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#050508] text-slate-200">
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            <BookOpen className="h-3.5 w-3.5" /> DreamMakerHub Blog
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Building in public.</h1>
          <p className="mt-4 text-base leading-7 text-zinc-400 md:text-lg">
            Product updates, technical lessons, founder notes, and the messy parts of building DreamMakerHub. Anyone can read. No account required.
          </p>
        </div>

        <div className="mt-12 grid gap-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-white/10 bg-zinc-950/50 p-6 transition hover:border-violet-500/40 hover:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-violet-300">{post.category}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{post.date}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white group-hover:text-violet-300">{post.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{post.excerpt}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
                Read article <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-zinc-500">
          Looking for Q&A or support instead?{' '}
          <Link href="/community" className="font-semibold text-violet-300 hover:text-violet-200">Visit the community.</Link>
        </div>
      </section>
    </main>
  );
}
