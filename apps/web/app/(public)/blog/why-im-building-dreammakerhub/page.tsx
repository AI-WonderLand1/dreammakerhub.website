import Link from 'next/link';

export const metadata = {
  title: "Why I'm Building DreamMakerHub | DreamMakerHub Blog",
  description: 'Why DreamMakerHub is being built as one place for AI-assisted creation, visual editing, development, and publishing.',
};

export default function ArticlePage() {
  return (
    <main className="min-h-screen bg-[#050508] text-slate-200">
      <article className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <Link href="/blog" className="text-sm text-violet-300 hover:text-violet-200">← Back to blog</Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-violet-300">Founder Notes · September 15, 2026</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Why I&apos;m Building DreamMakerHub</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-400">I started DreamMakerHub because building software with AI still feels scattered across too many tools. You can generate code in one place, edit visually somewhere else, open a cloud IDE in another tab, manage deployment somewhere else, and then somehow remember which service owns which part of the project.</p>

        <div className="mt-10 space-y-7 text-base leading-8 text-zinc-300">
          <p>DreamMakerHub is my attempt to bring that workflow together. The goal is simple: sign in, choose or create a project, edit it with AI and visual tools, work with the real project files, and publish when it is ready.</p>
          <p>I am building it around the idea that AI should help people create without hiding the real project from them. The visual builder should still connect to actual files. The cloud IDE should still be there when you need full control. AI should remember the project context instead of acting like every message is the first time it has seen your work.</p>
          <p>I am also building this in public because the useful parts are not only the wins. The broken deployments, bad UI choices, security fixes, architecture changes, and things I have to relearn are part of the story too. That is what this blog will cover.</p>
          <p>The long-term goal is a platform where a beginner can get started without being buried in setup, while an experienced developer can still get to the code, terminal, infrastructure, and project files when they need them.</p>
        </div>

        <div className="mt-12 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <h2 className="font-semibold text-white">Want to discuss it?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">The blog is public. The community is where members can ask questions, post help requests, vote, and reply.</p>
          <Link href="/community" className="mt-4 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200">Go to the community →</Link>
        </div>
      </article>
    </main>
  );
}
