import Link from "next/link";

export const metadata = {
  title: "Contact Us - AI Wonderland",
  description: "Get in touch with the AI Wonderland team. We're here to help you build amazing things.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-4">Contact Us</h1>
          <p className="text-lg text-white/70">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Tell us more about your question or issue..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition"
              >
                Send Message
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white/50 mb-2">Email</h3>
              <p className="text-white">support@dreammakerhub.website</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/50 mb-2">Discord</h3>
              <p className="text-white">
                Join our{" "}
                <a href="https://discord.gg/aiwonderland" className="text-purple-400 hover:underline">
                  Community Discord
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/50 mb-2">Twitter</h3>
              <p className="text-white">
                Follow us{" "}
                <a href="https://twitter.com/aiwonderland" className="text-purple-400 hover:underline">
                  @aiwonderland
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/50 mb-2">Support Hours</h3>
              <p className="text-white">24/7 for Pro and Team subscribers</p>
              <p className="text-white/60 text-sm">Community support available anytime</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}