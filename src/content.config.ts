import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string().default('BCRP'),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    excerpt: z.string(),
    featured_image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    end_date: z.coerce.date().optional(),
    time: z.string(),
    location: z.string(),
    address: z.string(),
    category: z.enum(['Monthly Meeting', 'Fundraiser', 'Convention', 'Election', 'Community']),
    description: z.string(),
    registration_url: z.string().optional(),
    featured_image: z.string().optional(),
  }),
});

const leadership = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/leadership' }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    photo: z.string().optional(),
    order: z.number(),
    type: z.enum(['county_leadership', 'precinct_chair', 'state_leadership']),
    precinct: z.string().optional(),
  }),
});

export const collections = { posts, events, leadership };
