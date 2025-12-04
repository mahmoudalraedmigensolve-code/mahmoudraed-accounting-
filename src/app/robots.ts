import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://accounting.moffex.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/_next/",
          "/login",
          "/select-tenant",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
