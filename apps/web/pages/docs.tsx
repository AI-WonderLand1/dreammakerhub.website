import Sidebar from "@/ui/components/docs/Sidebar";

export default function DocsPage() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* ——— Accessibility ——— */}
          <section id="accessibility">
            <h1 className="text-3xl font-bold text-pink-300 mb-4">Accessibility</h1>
            <p className="text-gray-300">
              AI‑Wonderland is built with inclusive design at its core. We follow WCAG 2.2 AA guidelines and
              provide keyboard‑first navigation, screen‑reader support, and high‑contrast themes.
            </p>
            <div className="mt-6 bg-[#141418] rounded-xl p-6 border border-white/10">
              <p className="text-sm font-semibold text-pink-200 mb-2">Accessibility Architecture</p>
              <svg viewBox="0 0 600 120" className="w-full max-w-2xl">
                <rect x="10" y="20" width="100" height="80" rx="8" fill="#1e1e24" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="60" y="70" textAnchor="middle" fill="#c4b5fd" fontSize="12">Keyboard</text>
                <text x="60" y="86" textAnchor="middle" fill="#c4b5fd" fontSize="12">Nav</text>
                <rect x="160" y="20" width="100" height="80" rx="8" fill="#1e1e24" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="210" y="70" textAnchor="middle" fill="#c4b5fd" fontSize="12">Screen</text>
                <text x="210" y="86" textAnchor="middle" fill="#c4b5fd" fontSize="12">Reader</text>
                <rect x="310" y="20" width="100" height="80" rx="8" fill="#1e1e24" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="360" y="70" textAnchor="middle" fill="#c4b5fd" fontSize="12">High</text>
                <text x="360" y="86" textAnchor="middle" fill="#c4b5fd" fontSize="12">Contrast</text>
                <rect x="460" y="20" width="120" height="80" rx="8" fill="#1e1e24" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="520" y="70" textAnchor="middle" fill="#c4b5fd" fontSize="12">Focus</text>
                <text x="520" y="86" textAnchor="middle" fill="#c4b5fd" fontSize="12">Indicators</text>
                <line x1="110" y1="60" x2="160" y2="60" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,3"/>
                <line x1="260" y1="60" x2="310" y2="60" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,3"/>
                <line x1="410" y1="60" x2="460" y2="60" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,3"/>
              </svg>
            </div>
          </section>

          {/* ——— Announcements ——— */}
          <section id="announcements">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Announcements</h2>
            <p className="text-gray-300">
              Stay up to date with platform releases, feature drops, and infrastructure changes.
            </p>
            <ul className="mt-4 space-y-3 list-disc list-inside text-gray-300">
              <li><span className="text-pink-200 font-semibold">v3.2</span> — Multi‑canvas builder, new AI reasoning engine.</li>
              <li><span className="text-pink-200 font-semibold">v3.1</span> — Terminal sync, improved file explorer.</li>
              <li><span className="text-pink-200 font-semibold">v3.0</span> — WonderSpace IDE, Community Hub launch.</li>
            </ul>
          </section>

          {/* ——— AI & Copilot ——— */}
          <section id="ai-copilot">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">AI &amp; Copilot</h2>

            <h3 id="alice-rick-discussions" className="text-xl font-semibold text-pink-200 mt-8 mb-2">Alice and Rick discussions</h3>
            <p className="text-gray-300">
              Bi‑weekly brainstorming sessions where our lead architects Alice and Rick debate AI architecture decisions,
              model trade‑offs, and agent design patterns.
            </p>

            <h3 id="alice-rick-updates" className="text-xl font-semibold text-pink-200 mt-8 mb-2">Alice and Rick updates and announcements</h3>
            <p className="text-gray-300">
              Follow the changelog of model improvements, new agent capabilities, and copilot enhancements driven by
              the Alice‑Rick design reviews.
            </p>

            <div className="mt-6 bg-[#141418] rounded-xl p-6 border border-white/10">
              <p className="text-sm font-semibold text-pink-200 mb-3">Copilot pipeline</p>
              <svg viewBox="0 0 600 100" className="w-full max-w-2xl">
                <rect x="10" y="10" width="120" height="80" rx="8" fill="#1e1e24" stroke="#34d399" strokeWidth="1.5"/>
                <text x="70" y="55" textAnchor="middle" fill="#6ee7b7" fontSize="11">User Prompt</text>
                <polygon points="135,50 145,40 145,60" fill="#34d399"/>
                <rect x="150" y="10" width="120" height="80" rx="8" fill="#1e1e24" stroke="#60a5fa" strokeWidth="1.5"/>
                <text x="210" y="55" textAnchor="middle" fill="#93c5fd" fontSize="11">Reasoning</text>
                <polygon points="275,50 285,40 285,60" fill="#60a5fa"/>
                <rect x="290" y="10" width="120" height="80" rx="8" fill="#1e1e24" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="350" y="55" textAnchor="middle" fill="#c4b5fd" fontSize="11">Action</text>
                <polygon points="415,50 425,40 425,60" fill="#a78bfa"/>
                <rect x="430" y="10" width="130" height="80" rx="8" fill="#1e1e24" stroke="#f472b6" strokeWidth="1.5"/>
                <text x="495" y="55" textAnchor="middle" fill="#f9a8d4" fontSize="11">Output</text>
              </svg>
            </div>
          </section>

          {/* ——— Apps, APIs & Webhooks ——— */}
          <section id="apps-apis" className="scroll-mt-4">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Apps, APIs &amp; Webhooks</h2>
            <p className="text-gray-300">
              Build native apps and third‑party integrations using our REST API, GraphQL endpoints, and real‑time webhooks.
              The entire platform is API‑first.
            </p>
            <ul className="mt-4 space-y-2 list-disc list-inside text-gray-300">
              <li><span className="text-pink-200 font-semibold">REST API</span> — Projects, snapshots, deployments.</li>
              <li><span className="text-pink-200 font-semibold">Webhooks</span> — Trigger CI/CD on push, PR, or release.</li>
              <li><span className="text-pink-200 font-semibold">GraphQL</span> — Flexible queries for builder state.</li>
            </ul>
          </section>

          <section id="mobile">
            <h3 className="text-xl font-semibold text-pink-200 mb-2">Mobile</h3>
            <p className="text-gray-300">
              Mobile‑optimised canvases and responsive previews. Build once, deploy to web, iOS, and Android via
              our code‑gen pipeline.
            </p>
          </section>

          {/* ——— Automation & Developer tools ——— */}
          <section id="automation-dev-tools">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Automation &amp; Developer tools</h2>

            <h3 id="actions" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Actions</h3>
            <p className="text-gray-300">
              GitHub Actions templates for CI/CD – lint, test, build, and deploy with one workflow.
            </p>

            <h3 id="npm" className="text-xl font-semibold text-pink-200 mt-6 mb-2">npm</h3>
            <p className="text-gray-300">
              Publish and consume private packages from our registry. Scoped to <code className="text-pink-200 bg-white/5 px-1 rounded">@ai-wonderland</code>.
            </p>

            <h3 id="packages" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Packages</h3>
            <p className="text-gray-300">
              <span className="text-pink-200 font-semibold">@ai-wonderland/ide-engine</span> — Editor core.<br/>
              <span className="text-pink-200 font-semibold">@ai-wonderland/optimizer</span> — Build optimisation.<br/>
              <span className="text-pink-200 font-semibold">@ai-wonderland/perf-assets</span> — Performance monitoring.
            </p>
          </section>

          {/* ——— Code & Contributions ——— */}
          <section id="code-contributions">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Code &amp; Contributions</h2>

            <h3 id="wonderspace" className="text-xl font-semibold text-pink-200 mt-6 mb-2">WonderSpace</h3>
            <p className="text-gray-300">
              The in‑browser IDE with AI assistance. Open the workspace, clone a repository, and start building
              in seconds – no local setup required.
            </p>

            <h3 id="pull-requests" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Pull Requests</h3>
            <p className="text-gray-300">
              Review code inline, trigger AI‑powered code reviews, and merge with squash‑commit from the
              Pull Requests dashboard.
            </p>

            <h3 id="repositories" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Repositories</h3>
            <p className="text-gray-300">
              Import existing GitHub repos or create new ones from a template. Every repo gets a WonderSpace
              environment automatically.
            </p>
          </section>

          {/* ——— Collaboration & Planning ——— */}
          <section id="collaboration-planning">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Collaboration &amp; Planning</h2>

            <h3 id="discussions" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Discussions</h3>
            <p className="text-gray-300">
              Threaded conversations attached to projects, pull requests, and documentation. Use
              <code className="text-pink-200 bg-white/5 px-1 rounded"> @mentions</code> to loop in teammates.
            </p>

            <h3 id="projects-issues" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Projects and Issues</h3>
            <p className="text-gray-300">
              Kanban‑style project boards with AI‑generated task breakdowns. Issues can be promoted from
              discussions or created directly.
            </p>
            <div className="mt-6 bg-[#141418] rounded-xl p-6 border border-white/10">
              <p className="text-sm font-semibold text-pink-200 mb-3">Planning flow</p>
              <svg viewBox="0 0 500 80" className="w-full max-w-xl">
                <rect x="10" y="10" width="100" height="60" rx="6" fill="#1e1e24" stroke="#f472b6" strokeWidth="1.5"/>
                <text x="60" y="46" textAnchor="middle" fill="#f9a8d4" fontSize="11">Idea</text>
                <polygon points="115,40 125,30 125,50" fill="#f472b6"/>
                <rect x="130" y="10" width="100" height="60" rx="6" fill="#1e1e24" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="180" y="46" textAnchor="middle" fill="#c4b5fd" fontSize="11">Issue</text>
                <polygon points="235,40 245,30 245,50" fill="#a78bfa"/>
                <rect x="250" y="10" width="100" height="60" rx="6" fill="#1e1e24" stroke="#60a5fa" strokeWidth="1.5"/>
                <text x="300" y="46" textAnchor="middle" fill="#93c5fd" fontSize="11">PR</text>
                <polygon points="355,40 365,30 365,50" fill="#60a5fa"/>
                <rect x="370" y="10" width="110" height="60" rx="6" fill="#1e1e24" stroke="#34d399" strokeWidth="1.5"/>
                <text x="425" y="46" textAnchor="middle" fill="#6ee7b7" fontSize="11">Deploy</text>
              </svg>
            </div>
          </section>

          {/* ——— Community Hub ——— */}
          <section id="community-hub">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Community Hub</h2>
            <p className="text-gray-300">
              The Community Hub is your central place to connect, learn, and share. Visit the
              {" "}<a href="/community" className="text-pink-200 underline">full community page</a>.
            </p>

            <h3 className="text-xl font-semibold text-pink-200 mt-6 mb-2">Welcome to Ai-wonderland innovation</h3>
            <p className="text-gray-300">
              Get started with our mission, values, and the roadmap ahead.
            </p>

            <h3 className="text-xl font-semibold text-pink-200 mt-6 mb-2">New to wonderland</h3>
            <p className="text-gray-300">
              First time here? Explore the getting‑started guide, join the welcome channel, and meet the builders.
            </p>

            <h3 className="text-xl font-semibold text-pink-200 mt-6 mb-2">Programming Help</h3>
            <p className="text-gray-300">
              Ask technical questions, share code snippets, and get help from the community.
            </p>

            <h3 className="text-xl font-semibold text-pink-200 mt-6 mb-2" id="community-education">Education &amp; Skilling</h3>
            <p className="text-gray-300">
              Access tutorials, workshops, and certification tracks. See the Discover section below for
              Wonder Education and Wonder Learn.
            </p>
          </section>

          {/* ——— Discover: Best Practices ——— */}
          <section id="discover-best-practices">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Discover: Best Practices</h2>

            <h3 id="wonder-education" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Wonder Education</h3>
            <p className="text-gray-300">
              Structured courses covering AI agent development, WonderBuild component creation, and deployment
              workflows. Earn badges as you complete modules.
            </p>

            <h3 id="wonder-learn" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Wonder Learn</h3>
            <p className="text-gray-300">
              Short interactive tutorials – 5‑15 minutes each – designed to teach one concept at a time.
              Perfect for quick upskilling.
            </p>
            <div className="mt-6 bg-[#141418] rounded-xl p-6 border border-white/10">
              <p className="text-sm font-semibold text-pink-200 mb-3">Learning path</p>
              <svg viewBox="0 0 550 90" className="w-full max-w-xl">
                <rect x="10" y="10" width="100" height="70" rx="8" fill="#1e1e24" stroke="#f472b6" strokeWidth="1.5"/>
                <text x="60" y="50" textAnchor="middle" fill="#f9a8d4" fontSize="10">Basics</text>
                <text x="60" y="65" textAnchor="middle" fill="#d1d5db" fontSize="9">2 hrs</text>
                <polygon points="115,45 125,35 125,55" fill="#f472b6"/>
                <rect x="130" y="10" width="100" height="70" rx="8" fill="#1e1e24" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="180" y="50" textAnchor="middle" fill="#c4b5fd" fontSize="10">Intermediate</text>
                <text x="180" y="65" textAnchor="middle" fill="#d1d5db" fontSize="9">4 hrs</text>
                <polygon points="235,45 245,35 245,55" fill="#a78bfa"/>
                <rect x="250" y="10" width="100" height="70" rx="8" fill="#1e1e24" stroke="#60a5fa" strokeWidth="1.5"/>
                <text x="300" y="50" textAnchor="middle" fill="#93c5fd" fontSize="10">Advanced</text>
                <text x="300" y="65" textAnchor="middle" fill="#d1d5db" fontSize="9">6 hrs</text>
                <polygon points="355,45 365,35 365,55" fill="#60a5fa"/>
                <rect x="370" y="10" width="150" height="70" rx="8" fill="#1e1e24" stroke="#34d399" strokeWidth="1.5"/>
                <text x="445" y="50" textAnchor="middle" fill="#6ee7b7" fontSize="10">Certification</text>
                <text x="445" y="65" textAnchor="middle" fill="#d1d5db" fontSize="9">Exam</text>
              </svg>
            </div>
          </section>

          {/* ——— Enterprise & Security ——— */}
          <section id="enterprise-security">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Enterprise &amp; Security</h2>

            <h3 id="code-security" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Code Security</h3>
            <p className="text-gray-300">
              End‑to‑end encryption, SOC 2 compliance, and granular permission controls. Every workspace is
              isolated and audited.
            </p>

            <h3 id="enterprise" className="text-xl font-semibold text-pink-200 mt-6 mb-2">Enterprise</h3>
            <p className="text-gray-300">
              Dedicated infrastructure, SSO/SAML, custom branding, SLA guarantees, and priority support.
              Contact our sales team for a custom quote.
            </p>
            <div className="mt-6 bg-[#141418] rounded-xl p-6 border border-white/10">
              <p className="text-sm font-semibold text-pink-200 mb-3">Security layers</p>
              <svg viewBox="0 0 450 130" className="w-full max-w-lg">
                <rect x="140" y="10" width="160" height="30" rx="6" fill="#1e1e24" stroke="#34d399" strokeWidth="1.5"/>
                <text x="220" y="30" textAnchor="middle" fill="#6ee7b7" fontSize="11">Application</text>
                <rect x="100" y="45" width="240" height="30" rx="6" fill="#1e1e24" stroke="#60a5fa" strokeWidth="1.5"/>
                <text x="220" y="65" textAnchor="middle" fill="#93c5fd" fontSize="11">Authentication &amp; Authorization</text>
                <rect x="50" y="80" width="340" height="30" rx="6" fill="#1e1e24" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="220" y="100" textAnchor="middle" fill="#c4b5fd" fontSize="11">Data Encryption &amp; Audit</text>
              </svg>
            </div>
          </section>

          {/* ——— Questions & Other Feedback ——— */}
          <section id="feedback">
            <h2 className="text-2xl font-bold text-pink-300 mb-4">Questions &amp; Other Feedback</h2>
            <p className="text-gray-300">
              Have an idea, a bug report, or just want to ask a question? We read every submission.
            </p>
            <ul className="mt-4 space-y-2 list-disc list-inside text-gray-300">
              <li><span className="text-pink-200 font-semibold">Feature Requests</span> – Share what you would like to see next.</li>
              <li><span className="text-pink-200 font-semibold">Bug Reports</span> – Use the <code className="text-pink-200 bg-white/5 px-1 rounded">/report</code> command in WonderSpace.</li>
              <li><span className="text-pink-200 font-semibold">General Ideas</span> – Post in the Community Hub forum.</li>
            </ul>
          </section>

        </div>
      </main>
    </div>
  );
}
