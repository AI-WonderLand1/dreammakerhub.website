import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/admin/",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://dreammakerhub.website/sitemap.xml",
    host: "https://dreammakerhub.website",
  };
}
