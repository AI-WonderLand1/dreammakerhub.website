import type { Metadata } from "next";
import Homepage from "./Homepage";

export const metadata: Metadata = {
  title: "DreamMakerHub | AI-Powered Web, App & 3D Creation",
  description:
    "Build websites, apps, AI workflows, cloud projects, and interactive 3D experiences with DreamMakerHub by AI WONDERLAND INNOVATION.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DreamMakerHub | AI-Powered Web, App & 3D Creation",
    description:
      "Build websites, apps, AI workflows, cloud projects, and interactive 3D experiences with DreamMakerHub.",
    url: "https://dreammakerhub.website",
    siteName: "DreamMakerHub",
    type: "website",
    images: ["/images/ai-wonderland-homepage.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DreamMakerHub | AI-Powered Web, App & 3D Creation",
    description:
      "Build websites, apps, AI workflows, cloud projects, and interactive 3D experiences with DreamMakerHub.",
    images: ["/images/ai-wonderland-homepage.png"],
  },
};

export default function HomepagePage() {
  return <Homepage />;
}
