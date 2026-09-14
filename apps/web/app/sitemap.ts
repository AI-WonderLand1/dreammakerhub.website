import type { MetadataRoute } from "next";

const baseUrl = "https://dreammakerhub.website";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/docs`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/features`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/refund`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/tutorials`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/api-reference`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
