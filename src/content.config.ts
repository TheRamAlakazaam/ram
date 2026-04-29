import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const requiredString = z.string().trim().min(1);
const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);
const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.date().optional(),
);
const stringList = z.array(requiredString).default([]);

const writingSchema = z.object({
  title: requiredString,
  description: requiredString,
  publishDate: z.coerce.date(),
  updatedDate: optionalDate,
  tags: stringList,
  featured: z.boolean().default(false),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: writingSchema,
});

const photos = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/photos" }),
  schema: z.object({
    title: requiredString,
    description: requiredString,
    publishDate: z.coerce.date(),
    location: requiredString,
    coverAlt: optionalString,
    coverImage: optionalString,
    gallery: stringList,
    tags: stringList,
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  blog,
  photos,
};
