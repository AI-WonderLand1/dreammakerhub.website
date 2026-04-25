import Link from 'next/link';

export default function DocsHome() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Documentation</h2>
        <nav className="space-y-2">
          <Link href="#introduction"><a className="block p-2 rounded hover:bg-gray-200">Introduction</a></Link>
          <Link href="#getting-started"><a className="block p-2 rounded hover:bg-gray-200">Getting Started</a></Link>
          <Link href="#api-reference"><a className="block p-2 rounded hover:bg-gray-200">API Reference</a></Link>
          <Link href="#authentication"><a className="block p-2 rounded hover:bg-gray-200">Authentication</a></Link>
          <Link href="#billing"><a className="block p-2 rounded hover:bg-gray-200">Billing & Subscriptions</a></Link>
          <Link href="#marketplace"><a className="block p-2 rounded hover:bg-gray-200">Marketplace</a></Link>
          <Link href="#faq"><a className="block p-2 rounded hover:bg-gray-200">FAQ</a></Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <section id="introduction" className="mb-12">
          <h1 className="text-3xl font-bold mb-4">Welcome to AI-WONDER Documentation</h1>
          <p className="text-lg text-gray-600">
            Explore comprehensive guides, tutorials, API references, and best practices to build powerful AI‑powered applications.
          </p>
          <div className="mt-4">
            <div className="relative w-full pb-[100%]">
              <iframe
                src="https://skybox.blockadelabs.com/e/6aa9d9fa2e747c8737d275e7a08a5e4f"
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="fullscreen"
              ></iframe>
            </div>
          </div>
        </section>
        <section id="getting-started" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">Getting Started</h2>
          <p>Learn how to set up your environment, install dependencies, and start building.</p>
        </section>
        <section id="api-reference" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">API Reference</h2>
          <p>Explore the available API endpoints, request schemas, and authentication methods.</p>
        </section>
        <section id="authentication" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">Authentication</h2>
          <p>Use Supabase Auth or custom OAuth for secure access. Learn how to manage user sessions.</p>
        </section>
        <section id="billing" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">Billing & Subscriptions</h2>
          <p>Manage plans, handle payments, and manage subscriptions with Stripe integration.</p>
        </section>
        <section id="marketplace" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">Marketplace</h2>
          <p>Post, browse, and install marketplace extensions or plugins.</p>
        </section>
        <section id="faq" className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">FAQ</h2>
          <p>Frequently asked questions and troubleshooting guide.</p>
        </section>
      </main>
    </div>
  );
}
