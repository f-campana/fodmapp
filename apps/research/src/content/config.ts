import { defineCollection, z } from "astro:content";

const pages = defineCollection({
  type: "content",
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
