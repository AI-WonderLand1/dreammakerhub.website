export const metadata = {
  title: "Blog - AI Wonderland",
  description: "Stories, tutorials, and insights from the AI Wonderland team.",
};

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "Building the Future: AI-Powered 3D Game Development",
      excerpt: "How we're using AI to make 3D game development accessible to everyone.",
      date: "June 15, 2026",
      author: "AI Wonderland Team",
      category: "Technology",
    },
    {
      id: 2,
      title: "Introducing WonderBuild: The AI App Builder",
      excerpt: "Three AI agents working together to turn your prompts into working code.",
      date: "May 28, 2026",
      author: "AI Wonderland Team",
      category: "Product",
    },
    {
      id: 3,
      title: "5 Ways AI is Transforming Creative Workflows",
      excerpt: "From concept to reality, see how AI accelerates the creative process.",
      date: "May 10, 2026",
      author: "Guest Contributor",
      category: "AI",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-4">Blog</h1>
          <p className="text-lg text-white/70">
            Stories, tutorials, and insights from the AI Wonderland team.
          </p>
        </div>

        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.id} className="border-b border-white/10 pb-8 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                  {post.category}
                </span>
                <span className="text-xs text-white/50">{post.date}</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 hover:text-purple-400 transition">
                <a href={`/blog/${post.id}`}>{post.title}</a>
              </h2>
              <p className="text-white/70 mb-3">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <span>By {post.author}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/50">More posts coming soon. Subscribe to our newsletter for updates.</p>
        </div>
      </div>
    </main>
  );
}