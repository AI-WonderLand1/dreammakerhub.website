"use client";

const features = [
  {
    title: "AI Playground",
    description: "Run tests and demos anytime. Applying changes and exports are included with your subscription.",
    included: "Personal",
  },
  {
    title: "Wonder-Build",
    description: "Visual builder with autosave, assets, responsive controls, and previews. Included with subscription.",
    included: "Personal",
  },
  {
    title: "Publish & Domains",
    description: "Publish static artifacts and connect custom domains. Included with subscription; Enterprise unlocks everything.",
    included: "Enterprise",
  },
  {
    title: "Marketplace & Extensions",
    description: "Browsing is open to all; installation requires an active subscription. Enterprise can enable advanced extensions.",
    included: "Personal",
  },
  {
    title: "WonderSpace IDE",
    description: "Project CRUD, import/export, and safe terminal access included with your subscription.",
    included: "Personal",
  },
];

export default function FeaturesPage() {
  const isSubscribed = false;
  const ctaLabel = isSubscribed ? "Open" : "Upgrade to use";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 bg-blend-overlay animate-gradient text-white">
      <nav className="w-full px-6 py-4 bg-black/40 backdrop-blur-md flex items-center justify-between">
        <div className="text-xl font-bold tracking-wide">Wonderland</div>
        <div className="flex gap-6 text-sm">
          <a href="/" className="hover:text-pink-300 transition">Home</a>
          <a href="/features" className="hover:text-pink-300 transition">Features</a>
          <a href="/dashboard" className="hover:text-pink-300 transition">Dashboard</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto mt-14 px-6">
        <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-8 shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-pink-200 mb-2">Subscription Features</p>
          <h1 className="text-4xl font-bold mb-3">All features are included with a subscription.</h1>
          <p className="text-lg text-pink-100">
            Personal unlocks everything you see here. Enterprise unlocks every module, extension, and publish capability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {features.map((feature) => (
            <div key={feature.title} className="bg-black/40 border border-white/15 rounded-2xl p-6 backdrop-blur-lg shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="space-x-2">
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white/10">Subscription feature</span>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white/15">
                    Included in {feature.included}
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
              <p className="text-sm text-pink-50 mb-4">{feature.description}</p>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isSubscribed
                    ? "bg-white text-black hover:bg-pink-100"
                    : "bg-pink-600 hover:bg-pink-700 text-white"
                }`}
              >
                {ctaLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .animate-gradient {
          background-size: 300% 300%;
          animation: gradientShift 12s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
