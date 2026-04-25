import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Documentation</h2>
        <nav className="space-y-2">
          <Link href="#introduction"><a className="block p-2 rounded hover:bg-gray-200">Introduction</a></Link>
          <Link href="#getting-started"><a className="block p-2 rounded hover:bg-gray-200">Getting Started</a></Link>
          <Link href="#api"><a className="block p-2 rounded hover:bg-gray-200">API Reference</a></Link>
          <Link href="#auth"><a className="block p-2 rounded hover:bg-gray-200">Authentication</a></Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <section id="introduction" className="mb-12">
          <h1 className="text-3xl font-bold mb-4">AI‑WONDER Documentation</h1>
          <p className="text-lg text-gray-600">
            Welcome—quick guides, API details and best‑practice notes, all without exposing source code.
          </p>
        </section>

        <section id="getting-started" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">Getting Started</h2>
          <p>Install packages, set environment variables and spin up a project in minutes.</p>
        </section>

        <section id="api" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">API Reference</h2>
          <p>High‑level API endpoints, authentication flow and rate‑limit guidelines.</p>
        </section>

        <section id="auth" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">Authentication</h2>
          <p>Secure sessions via Supabase, OAuth and JSON web tokens—no source code leaks.</p>
        </section>
      </main>
    </div>
  );
}
