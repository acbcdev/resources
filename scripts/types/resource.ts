import { z } from 'zod';

/**
 * Open Graph metadata extracted from a webpage
 */
export const OGMetadataSchema = z
	.object({
		title: z.string().optional(),
		url: z.string().url().optional(),
		image: z.string().url().optional(),
		description: z.string().optional(),
		type: z.string().optional(),
		site_name: z.string().optional(),
		video: z.string().optional(),
		icon: z.string().optional(),
	})
	.strict();

export type OGMetadata = z.infer<typeof OGMetadataSchema>;

/**
 * Resource with Open Graph data extracted
 */
export const ResourceWithOGSchema = z
	.object({
		url: z.url(),
		og: OGMetadataSchema,
		extracted_at: z.string().datetime().optional(),
		extraction_method: z.enum(['fetch', 'browser']).optional(),
	})
	.strict();

export type ResourceWithOG = z.infer<typeof ResourceWithOGSchema>;

/**
 * AI-generated metadata for a resource
 */
export const AIMetadataSchema = z
	.object({
		name: z.string(),
		description: z.string(),
		category: z.array(z.string()),
		topic: z.string().optional(),
		main_features: z
			.array(
				z.object({
					feature: z.string(),
					description: z.string(),
				}),
			)
			.optional(),
		tags: z.array(z.string()).optional(),
		targetAudience: z.array(z.string()).optional(),
		pricing: z.enum(['Free', 'Paid', 'Freemium', 'Opensource', 'Premium']).optional(),
	})
	.strict();

export type AIMetadata = z.infer<typeof AIMetadataSchema>;

/**
 * Resource with AI enrichment
 */
export const ResourceWithAISchema = ResourceWithOGSchema.extend({
	name: z.string(),
	description: z.string(),
	category: z.array(z.string()),
	topic: z.string().optional(),
	main_features: z
		.array(
			z.object({
				feature: z.string(),
				description: z.string(),
			}),
		)
		.optional(),
	tags: z.array(z.string()).optional(),
	targetAudience: z.array(z.string()).optional(),
	pricing: z.enum(['Free', 'Paid', 'Freemium', 'Opensource', 'Premium']).optional(),
	enriched_at: z.string().datetime().optional(),
}).strict();

export type ResourceWithAI = z.infer<typeof ResourceWithAISchema>;

/**
 * Resource with screenshot/image information
 */
export const ResourceWithScreenshotSchema = ResourceWithAISchema.extend({
	image: z.string().url().optional(),
	image_source: z.enum(['og', 'screenshot', 'none']).optional(),
	screenshot_at: z.string().datetime().optional(),
}).strict();

export type ResourceWithScreenshot = z.infer<typeof ResourceWithScreenshotSchema>;

/**
 * Final merged resource with timestamps
 */
export const MergedResourceSchema = ResourceWithScreenshotSchema.extend({
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
}).strict();

export type MergedResource = z.infer<typeof MergedResourceSchema>;

/**
 * Batch operation result
 */
export const BatchResultSchema = z
	.object({
		successful: z.number(),
		failed: z.number(),
		skipped: z.number(),
		errors: z
			.array(
				z.object({
					url: z.string().url(),
					error: z.string(),
				}),
			)
			.optional(),
	})
	.strict();

export type BatchResult = z.infer<typeof BatchResultSchema>;
