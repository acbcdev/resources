/**
 * Featured Content Helper
 * Centralized data selection with strict quality validation
 * Ensures only production-ready content appears in featured sections
 */

import { DATA } from '@/data';
// import newUrls from '@/data/new.json';
import { collections } from '@/features/common/consts/collections';
import { slugify } from '@/features/common/lib/utils';
import type { Tool } from '@/features/common/types/resource';

// Featured content configuration
const MAJOR_CATEGORIES = ['AI', 'Design', 'Libraries', 'Tools', 'Learning Resources'];
const CATEGORY_HIGHLIGHTS_COUNT = 3;
const NEW_CAROUSEL_RESOURCES = 3;
const FEATURED_CAROUSEL_COLLECTIONS = 2;
const DEFAULT_COLLECTION_DESCRIPTION = 'Curated collection of resources';
const PLACEHOLDER_IMAGE = 'https://placehold.co/1200x400';

/**
 * Validate that a resource has COMPLETE metadata
 * STRICT validation: all required fields must exist
 * This ensures only production-ready resources appear in featured sections
 */
export function hasCompleteMetadata(resource: Tool): boolean {
	return !!(
		resource.name &&
		resource.url &&
		resource.description &&
		resource.og?.image &&
		resource.og?.description
	);
}

/**
 * Get featured resources with complete metadata
 * Returns recent resources (last 30 days) that pass strict validation
 */
export function getFeaturedResources(count: number): Tool[] {
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	return DATA.filter(hasCompleteMetadata)
		.filter((r) => new Date(r.createdAt) > thirtyDaysAgo)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, count);
}

/**
 * Get new resources from new.json
 * Only includes resources with complete metadata
 */
export function getNewResources(count: number): Tool[] {
	const newUrlsSet = new Set([]);

	return DATA.filter((r) => newUrlsSet.has(r.url))
		.filter(hasCompleteMetadata)
		.slice(0, count);
}

/**
 * Get one featured resource per major category
 * Provides category highlights for carousel
 */
export function getCategoryHighlights(): Tool[] {
	return MAJOR_CATEGORIES
		.map((category) => {
			const matching = DATA.filter((r) => r.category.includes(category))
				.filter(hasCompleteMetadata)
				.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

			return matching;
		})
		.filter((r): r is Tool => r !== undefined);
}

/**
 * Get featured collections
 * Only includes collections with data
 */
export function getFeaturedCollections(count: number) {
	return collections.filter((c) => c && c.data && c.data.length > 0).slice(0, count);
}

/**
 * Helper to convert a resource to carousel item format
 */
function resourceToCarouselItem(resource: Tool, idPrefix: string) {
	return {
		id: `${idPrefix}-${resource.url}`,
		type: 'resource' as const,
		name: resource.name,
		description: resource.description,
		url: resource.url,
		og: resource.og,
	};
}

/**
 * Get carousel data
 * Combines: category highlights + new resources + featured collections
 * Used for the hero carousel on homepage
 */
export function getCarouselData() {
	const categoryHighlights = getCategoryHighlights();
	const newResources = getNewResources(NEW_CAROUSEL_RESOURCES);
	const featuredCollections = getFeaturedCollections(FEATURED_CAROUSEL_COLLECTIONS).filter(
		(c): c is NonNullable<typeof c> => c !== null && c !== undefined,
	);

	const carouselItems = [
		// Category highlights
		...categoryHighlights.map((resource) => resourceToCarouselItem(resource, 'category')),

		// New resources
		...newResources.map((resource) => resourceToCarouselItem(resource, 'new')),

		// Featured collections
		...featuredCollections.map((collection) => ({
			id: `collection-${collection.name}`,
			type: 'collection' as const,
			name: collection.name,
			description: collection.description || DEFAULT_COLLECTION_DESCRIPTION,
			url: `/collections/${slugify(collection.name)}/`,
			og: {
				image: collection.img || PLACEHOLDER_IMAGE,
				description: collection.description || 'Curated collection',
			},
		})),
	];

	return carouselItems;
}
