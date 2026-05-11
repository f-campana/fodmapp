import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title_fr: z.string(),
    title_en: z.string(),
    summary_fr: z.string(),
    summary_en: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  pages,
};
