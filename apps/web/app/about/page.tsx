export const metadata = {
  title: "About Us - AI Wonderland",
  description: "We're building the future of creative technology, one AI-powered experience at a time.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-4">About AI Wonderland</h1>
          <p className="text-lg text-white/70">
            We're building the future of creative technology, one AI-powered experience at a time.
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-white/80">
              AI Wonderland was founded with a simple mission: to democratize creative technology. 
              We believe that building websites, 3D games, and interactive experiences should not 
              require years of coding experience. With AI as your creative partner, the only limit 
              is your imagination.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <p className="text-white/80">
              Founded in 2024 by a team of developers, designers, and AI enthusiasts, AI Wonderland 
              started as an experiment in AI-assisted development. What began as an internal tool 
              quickly proved its value to early users, leading us to open our platform to creators 
              worldwide.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">The Team</h2>
            <p className="text-white/80">
              We're a distributed team of builders, dreamers, and AI researchers spread across the 
              globe. When we're not coding or designing, you'll find us playing in 3D editors, 
              debating the latest AI research papers, or mentoring new creators in our community.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Values</h2>
            <ul className="space-y-3 text-white/80">
              <li><strong className="text-purple-400">Creativity First:</strong> We exist to amplify human creativity, not replace it.</li>
              <li><strong className="text-purple-400">Accessibility:</strong> Great tools should be available to everyone.</li>
              <li><strong className="text-purple-400">Transparency:</strong> We believe in open communication and honest feedback.</li>
              <li><strong className="text-purple-400">Growth:</strong> Both for our users and our team.</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <a
            href="/careers"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            View Careers
          </a>
        </div>
      </div>
    </main>
  );
}