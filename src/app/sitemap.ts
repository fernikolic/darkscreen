import type { MetadataRoute } from "next";
import { getAllSeoRoutes } from "@/data/seo";

const BASE_URL = "https://darkscreens.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = getAllSeoRoutes();

  return routes.map((route) => {
    // Determine priority based on route type
    let priority = 0.5;
    let changeFrequency: "daily" | "weekly" | "monthly" = "weekly";

    if (route === "/") {
      priority = 1.0;
      changeFrequency = "daily";
    } else if (route === "/library" || route === "/flows") {
      priority = 0.9;
      changeFrequency = "daily";
    } else if (route.startsWith("/library/") && !route.includes("/", 10)) {
      priority = 0.8;
    } else if (route.startsWith("/screenshots/")) {
      priority = 0.8;
    } else if (route.startsWith("/compare/")) {
      priority = 0.7;
    } else if (route.startsWith("/alternatives/")) {
      priority = 0.7;
    } else if (route.startsWith("/category/") || route.startsWith("/chain/")) {
      priority = 0.7;
    } else if (route.startsWith("/design/") || route.startsWith("/patterns/")) {
      priority = 0.6;
    } else if (route.startsWith("/changelog/")) {
      priority = 0.6;
      changeFrequency = "daily";
    } else if (route.startsWith("/screens/")) {
      priority = 0.4;
      changeFrequency = "monthly";
    }

    return {
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });
}
