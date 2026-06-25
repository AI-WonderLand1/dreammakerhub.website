export const metadata = {
  title: "Careers - AI Wonderland",
  description: "Join the AI Wonderland team and help build the future of creative technology.",
};

export default function CareersPage() {
  const positions = [
    {
      title: "Senior AI Engineer",
      location: "Remote",
      type: "Full-time",
      description: "Help us build the next generation of AI-powered creative tools.",
    },
    {
      title: "3D Graphics Engineer",
      location: "Remote",
      type: "Full-time",
      description: "Optimize real-time 3D rendering for browser-based experiences.",
    },
    {
      title: "Product Designer",
      location: "Remote",
      type: "Full-time",
      description: "Design interfaces that make AI feel intuitive and magical.",
    },
    {
      title: "Developer Advocate",
      location: "Hybrid",
      type: "Full-time",
      description: "Help creators succeed and build amazing things with our platform.",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-4">Careers at AI Wonderland</h1>
          <p className="text-lg text-white/70">
            Join us in building the future of creative technology.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Why Join Us?</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="font-bold text-purple-400 mb-2">Impact</h3>
              <p className="text-white/70 text-sm">Build tools used by creators worldwide.</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="font-bold text-purple-400 mb-2">Innovation</h3>
              <p className="text-white/70 text-sm">Work with cutting-edge AI and web technologies.</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="font-bold text-purple-400 mb-2">Flexibility</h3>
              <p className="text-white/70 text-sm">Remote-first culture with flexible schedules.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
        <div className="space-y-4">
          {positions.map((pos) => (
            <div key={pos.title} className="border border-white/10 rounded-lg p-6 hover:border-purple-500/50 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1">{pos.title}</h3>
                  <p className="text-white/60 text-sm mb-2">{pos.description}</p>
                  <div className="flex gap-3 text-xs">
                    <span className="px-2 py-1 bg-gray-800 rounded">{pos.location}</span>
                    <span className="px-2 py-1 bg-gray-800 rounded">{pos.type}</span>
                  </div>
                </div>
                <a
                  href={`/careers/${pos.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded text-purple-300 text-sm hover:bg-purple-600/30 transition"
                >
                  Apply
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/50">Don't see a position that fits? Send us your resume anyway.</p>
          <a
            href="mailto:careers@dreammakerhub.website"
            className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            Contact Us
          </a>
        </div>
      </div>
    </main>
  );
}