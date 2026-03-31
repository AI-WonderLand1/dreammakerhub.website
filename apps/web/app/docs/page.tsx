"use client";

import React from "react";

export default function DocsPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 animate-gradient text-white">
      {/* NAV */}
      <nav className="w-full px-6 py-4 bg-black/40 backdrop-blur-md flex items-center justify-between">
        <div className="text-xl font-bold tracking-wide">Wonderland</div>
        <div className="flex gap-6 text-sm">
          <a href="/" className="hover:text-pink-300 transition">Home</a>
          <a href="/features" className="hover:text-pink-300 transition">Features</a>
          <a href="/docs" className="hover:text-pink-300 transition">Docs</a>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto mt-12 mb-20 p-8 bg-white/20 backdrop-blur-xl rounded-xl shadow-xl">
        <h1 className="text-4xl font-bold mb-6">Wonderland API Developer Guide</h1>
        <p className="text-lg mb-8 opacity-90">
          A complete guide for developers integrating with Wonderland’s API system.
          This page covers authentication, API tokens, secure requests, rate limits,
          and real-world examples — all rewritten in Wonderland’s style.
        </p>

        <Section title="Authentication">
          <p>
            Wonderland uses <strong>Bearer tokens</strong> for all API requests.
            Before calling any endpoint, generate a token and pass it in the header.
          </p>

          <CodeBlock
            code={`export WL_TOKEN="your_api_token_here"

curl -X GET https://api.wonderland.ai/v1/me \\
  -H "Authorization: Bearer $WL_TOKEN" \\
  -H "Accept: application/json"`}
          />

          <CodeBlock
            code={`{
  "id": "user_123",
  "username": "michael",
  "name": "Michael"
}`}
          />
        </Section>

        <Section title="Making Secure API Requests">
          <p>
            Always include <strong>Authorization</strong>, <strong>Accept</strong>, and{" "}
            <strong>Content-Type</strong> headers.
          </p>

          <CodeBlock
            code={`curl -X GET https://api.wonderland.ai/v1/projects \\
  -H "Authorization: Bearer $WL_TOKEN" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json"`}
          />
        </Section>

        <Section title="Triggering Workflows">
          <p>Trigger a workflow with a simple POST request:</p>

          <CodeBlock
            code={`curl -X POST https://api/wonderland.ai/v1/projects/{project_id}/workflows \\
  -H "Authorization: Bearer $WL_TOKEN" \\
  -H "Content-Type: application/json"`}
          />

          <p className="mt-4">With parameters:</p>

          <CodeBlock
            code={`curl -X POST https://api.wonderland.ai/v1/projects/{project_id}/workflows \\
  -H "Authorization: Bearer $WL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "branch": "main",
    "parameters": {
      "image_tag": "4.8.2"
    }
  }'`}
          />
        </Section>

        <Section title="Rate Limits">
          <p>
            Wonderland enforces rate limits to ensure system stability.
            If you exceed limits, you’ll receive <strong>HTTP 429</strong> and a{" "}
            <strong>Retry-After</strong> header.
          </p>

          <CodeBlock code={`Retry-After: 3`} />
        </Section>

        <Section title="Get Project Details">
          <CodeBlock
            code={`curl -X GET https://api/wonderland.ai/v1/projects/{project_id} \\
  -H "Authorization: Bearer $WL_TOKEN" \\
  -H "Accept: application/json"`}
          />

          <CodeBlock
            code={`{
  "id": "wl/github/michael/wonderland",
  "name": "Wonderland",
  "owner": "michael",
  "default_branch": "main"
}`}
          />
        </Section>

        <Section title="Get Job Details">
          <CodeBlock
            code={`curl -X GET https://api/wonderland.ai/v1/projects/{project_id}/jobs/{job_id} \\
  -H "Authorization: Bearer $WL_TOKEN"`}
          />

          <CodeBlock
            code={`{
  "id": "job_123",
  "state": "success",
  "duration": 42,
  "workflow_id": "wf_92f8a1c3"
}`}
          />
        </Section>
      </div>

      {/* ANIMATION */}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-3">{title}</h2>
      <div className="space-y-4 opacity-90">{children}</div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-sm">
      <code>{code}</code>
    </pre>
  );
}
