import { z } from 'zod';
import { collectionNames } from '@/features/common/consts/collections';
import { slugify } from '@/features/common/lib/utils';
import { CategorySchema } from '@/features/categories/types/category';
import { TargetAudienceSchema } from '@/features/audiences/types/audience';

export const FeatureSchema = z.object({
	feature: z.string(),
	description: z.string(),
});

export const OgSchema = z.object({
	title: z.string().optional(),
	url: z.string().url().optional(),
	image: z.string().url().optional(),
	type: z.string().optional(),
	site_name: z.string().optional(),
	description: z.string().optional(),
	icon: z.string().optional(),
	video: z.string().optional(),
});

const colletions = collectionNames;
const collectionsSchema = z.enum(colletions);

export const ToolSchema = z.object({
	name: z.string(),
	description: z.string(),
	image: z.string().url().optional(),
	category: z.union([CategorySchema, z.array(CategorySchema)]),
	url: z.string().url(),
	topic: z.string(),
	main_features: z.array(FeatureSchema).optional(),
	tags: z.array(z.string()).transform((tags) => tags.map((tag) => slugify(tag))),
	targetAudience: z.union([TargetAudienceSchema, z.array(TargetAudienceSchema)]).optional(),
	pricing: z.enum(['Free', 'Freemium', 'Paid', 'Premium', 'Opensource']).optional(),
	alternatives: z.array(z.string()).optional(),
	og: OgSchema.optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	collections: z.union([collectionsSchema, z.array(collectionsSchema)]).optional(),
});

export type Tool = z.infer<typeof ToolSchema>;
