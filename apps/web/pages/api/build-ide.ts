import { supabase } from "@/lib/supabase";

export default async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { template, repoUrl } = await req.json();

    // In a real app, verify user session server-side.
    // For demo, we assume auth is handled elsewhere.

    const response = await fetch("https://coder.dreammakerhub.website/api/v2/workspaces", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CODER_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template,
        parameters: { repo_url: repoUrl },
      }),
    });

    if (!response.ok) throw new Error("Failed to create workspace");

    const data = await response.json();
    res.status(200).json({ workspaceUrl: data.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};;