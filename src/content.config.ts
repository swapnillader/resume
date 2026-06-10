import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    blurb: z.string(),
    tags: z.array(z.string()).default([]),
    demoUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    date: z.coerce.date(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    externalUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    date: z.coerce.date(),
  }),
});

export const collections = { projects, writing };
