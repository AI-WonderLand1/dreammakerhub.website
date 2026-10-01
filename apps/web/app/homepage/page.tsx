import type { Metadata } from "next";
import Homepage from "./Homepage";

export const metadata: Metadata = {
  title: "AI WONDERLAND | AI-Powered Web, App & 3D Creation",
  description:
    "Build websites, apps, AI workflows, cloud projects, and interactive 3D experiences with AI WONDERLAND by AI WONDERLAND INNOVATION.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI WONDERLAND | AI-Powered Web, App & 3D Creation",
    description:
      "Build websites, apps, AI workflows, cloud projects, and interactive 3D experiences with AI WONDERLAND.",
    url: "https://dreammakerhub.website",
    siteName: "AI WONDERLAND",
    type: "website",
    images: ["/images/ai-wonderland-homepage.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI WONDERLAND | AI-Powered Web, App & 3D Creation",
    description:
      "Build websites, apps, AI workflows, cloud projects, and interactive 3D experiences with AI WONDERLAND.",
    images: ["/images/ai-wonderland-homepage.png"],
  },
};

export default function HomepagePage() {
  return <Homepage />;
}
