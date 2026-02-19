import type { MetadataRoute } from "next";
import { getAllSeoRoutes } from "@/data/seo";

const BASE_URL = "https://darkscreens.xyz";
const CHUNK_SIZE = 2000;

function getRouteMetadata(route: string) {
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
  } else if (route === "/text-search" || route === "/elements" || route === "/performance" || route === "/techstack") {
    priority = 0.7;
  } else if (route.startsWith("/elements/")) {
    priority = 0.6;
  } else if (route.startsWith("/design/") || route.startsWith("/patterns/")) {
    priority = 0.6;
  } else if (route.startsWith("/changelog/")) {
    priority = 0.6;
    changeFrequency = "daily";
  } else if (route.startsWith("/screens/")) {
    priority = 0.4;
    changeFrequency = "monthly";
  }

  return { priority, changeFrequency };
}

export async function generateSitemaps() {
  const routes = getAllSeoRoutes();
  const count = Math.ceil(routes.length / CHUNK_SIZE);
  return Array.from({ length: count }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const routes = getAllSeoRoutes();
  const chunk = routes.slice(id * CHUNK_SIZE, (id + 1) * CHUNK_SIZE);

  return chunk.map((route) => {
    const { priority, changeFrequency } = getRouteMetadata(route);
    return {
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });
}
