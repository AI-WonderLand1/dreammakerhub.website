export const metadata = {
  title: "FAQ - AI Wonderland",
  description: "Frequently asked questions about AI Wonderland, our platform, and creative tools.",
};

export default function FaqPage() {
  const faqs = [
    {
      question: "What is AI Wonderland?",
      answer: "AI Wonderland is a creative platform that lets you build websites, 3D games, and interactive experiences using natural language prompts and AI assistance. No coding required, but full code access when you want it.",
    },
    {
      question: "How does the AI builder work?",
      answer: "Our multi-agent workflow uses three AI agents: the Architect plans your project, the Builder writes the code, and the Reviewer polishes it. You describe what you want in plain English, and we handle the rest.",
    },
    {
      question: "Do I need to know how to code?",
      answer: "No! AI Wonderland is designed for creators of all skill levels. However, if you know code, you can always dive into the generated source and customize it further.",
    },
    {
      question: "What are the system requirements?",
      answer: "AI Wonderland runs entirely in your browser. We support the latest Chrome, Firefox, Safari, and Edge. For 3D development, we recommend a modern GPU for the best experience.",
    },
    {
      question: "What's the difference between the plans?",
      answer: "The Nomad plan is free with basic features. The Architect plan ($35/mo) gives you unlimited AI chats, WonderPlay 3D engine, and WonderSpace IDE. The Guild plan ($149/mo) adds team collaboration and shared assets.",
    },
    {
      question: "Can I deploy my projects?",
      answer: "Yes! You can deploy to various platforms including Vercel, Netlify, GitHub Pages, or your own hosting. The deployment process is streamlined with one-click options.",
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel anytime from your account settings. Your subscription will remain active until the end of your billing period.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We use industry-standard encryption for data in transit and at rest. We never use your projects to train our AI models without your explicit permission.",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-white/70">
            Everything you need to know about AI Wonderland.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-white/10 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-3 text-purple-400">{faq.question}</h2>
              <p className="text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/50">Still have questions?</p>
          <a
            href="/contact"
            className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}