import { z } from 'zod';
import { collectionNames } from '@/features/common/consts/collections';
import { slugify } from '@/features/common/lib/utils';
import { CategorySchema } from '@/features/categories/types/category';
import {
	TargetAudienceSchema,
	type TargetAudience,
} from '@/features/audiences/types/audience';

// ============================================================================
// Helper Schemas
// ============================================================================

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

// ============================================================================
// Enums and Constants
// ============================================================================

export const ResourceStatusSchema = z.enum(['active', 'deprecated', 'beta', 'sunset']);
export type ResourceStatus = z.infer<typeof ResourceStatusSchema>;

export const PricingSchema = z.enum(['Free', 'Freemium', 'Paid', 'Premium', 'Opensource']);
export type Pricing = z.infer<typeof PricingSchema>;

const collectionsSchema = z.enum(collectionNames);
export type Collection = z.infer<typeof collectionsSchema>;

// Export Category type from the schema
export type Category = z.infer<typeof CategorySchema>;

// ============================================================================
// Main Tool Schema
// ============================================================================

export const ToolSchema = z
	.object({
		// Core Identity
		name: z.string().min(1),
		slug: z.string().optional(),
		description: z.string().min(1),
		url: z.string().url(),
		image: z.string().url().optional(),
		icon: z.string().url().optional(),

		// Categorization (strict enum arrays)
		category: z.array(CategorySchema),
		targetAudience: z.array(TargetAudienceSchema).optional().default([]),
		collections: z.array(collectionsSchema).optional().default([]),

		// Content Details
		topic: z.string(),
		main_features: z.array(FeatureSchema).optional(),
		tags: z.array(z.string()).transform((tags) => tags.map((tag) => slugify(tag))),
		pricing: PricingSchema.optional(),
		og: OgSchema.optional(),

		// Status Tracking
		status: ResourceStatusSchema.optional().default('active'),
		lastCheckedAt: z.string().datetime().optional(),
		verifiedByTeam: z.boolean().optional().default(false),

		// Technical Metadata
		license: z.string().optional(),
		codeRepository: z.string().url().optional(),
		apiAvailable: z.boolean().optional(),
		requiresAuth: z.boolean().optional(),

		// Discovery
		relatedTools: z.array(z.string()).optional().default([]),
		integrations: z.array(z.string()).optional().default([]),

		// Timestamps
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.transform((data) => ({
		...data,
		slug: data.slug ?? slugify(data.name),
	}));

// ============================================================================
// Derived Types
// ============================================================================

export type Tool = z.infer<typeof ToolSchema>;
export type ToolInput = z.input<typeof ToolSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if resource has complete metadata for display
 */
export function hasCompleteMetadata(resource: Tool): boolean {
	return !!(
		resource.name &&
		resource.url &&
		resource.description &&
		(resource.og?.image || resource.image) &&
		(resource.og?.description || resource.description)
	);
}

/**
 * Check if resource is in a specific category
 */
export function hasCategory(resource: Tool, category: Category): boolean {
	return resource.category.includes(category);
}

/**
 * Check if resource targets a specific audience
 */
export function hasTargetAudience(resource: Tool, audience: TargetAudience): boolean {
	return resource.targetAudience.includes(audience);
}

/**
 * Check if resource is in a specific collection
 */
export function inCollection(resource: Tool, collection: Collection): boolean {
	return resource.collections.includes(collection);
}

/**
 * Filter resources by status
 */
export function filterByStatus(resources: Tool[], status: ResourceStatus): Tool[] {
	return resources.filter((r) => r.status === status);
}
