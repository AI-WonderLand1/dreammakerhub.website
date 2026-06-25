import Sidebar from "@/ui/components/docs/Sidebar";

export default function DocsPage() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-4xl mx-auto space-y-16">
          <p className="text-lg text-gray-400">
            Explore the documentation using the sidebar. Start with the Community Hub or dive into AI &amp; Copilot.
            Every section contains diagrams, examples, and best practices.
          </p>
        </div>
      </main>
    </div>
  );
}
