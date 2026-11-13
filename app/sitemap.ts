import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) return [];

  const paths = ["", ...projects.map((project) => `/projects/${project.id}`)];
  return paths.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "monthly", priority: path ? 0.7 : 1 }));
}
