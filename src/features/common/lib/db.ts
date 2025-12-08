import {
	Category,
	Collection,
	db,
	eq,
	Resource,
	ResourceAudience,
	ResourceCategory,
	ResourceCollection,
	ResourceFeature,
	ResourceOg,
	ResourceRelation,
	ResourceTag,
	Tag,
	TargetAudience,
} from 'astro:db';
import type { Tool, ToolInput } from '@/features/resources/types/resource';
import type { Category as CategoryType } from '@/features/categories/types/category';
import type { TargetAudience as AudienceType } from '@/features/audiences/types/audience';
import { slugify } from './utils';

// ============================================================================
// Type Definitions for DB rows
// ============================================================================

type ResourceRow = typeof Resource.$inferSelect;
type ResourceOgRow = typeof ResourceOg.$inferSelect;
type ResourceFeatureRow = typeof ResourceFeature.$inferSelect;
type CategoryRow = typeof Category.$inferSelect;
type TagRow = typeof Tag.$inferSelect;
type TargetAudienceRow = typeof TargetAudience.$inferSelect;
type CollectionRow = typeof Collection.$inferSelect;

// ============================================================================
// Helper: Transform DB rows to Tool type
// ============================================================================

async function transformToTool(resource: ResourceRow): Promise<Tool> {
	// Fetch related data
	const [og, features, categories, tags, audiences, collections, relations] = await Promise.all([
		db.select().from(ResourceOg).where(eq(ResourceOg.resourceId, resource.id)).get(),
		db.select().from(ResourceFeature).where(eq(ResourceFeature.resourceId, resource.id)),
		db
			.select({ name: Category.name })
			.from(ResourceCategory)
			.innerJoin(Category, eq(ResourceCategory.categoryId, Category.id))
			.where(eq(ResourceCategory.resourceId, resource.id)),
		db
			.select({ name: Tag.name })
			.from(ResourceTag)
			.innerJoin(Tag, eq(ResourceTag.tagId, Tag.id))
			.where(eq(ResourceTag.resourceId, resource.id)),
		db
			.select({ name: TargetAudience.name })
			.from(ResourceAudience)
			.innerJoin(TargetAudience, eq(ResourceAudience.audienceId, TargetAudience.id))
			.where(eq(ResourceAudience.resourceId, resource.id)),
		db
			.select({ name: Collection.name })
			.from(ResourceCollection)
			.innerJoin(Collection, eq(ResourceCollection.collectionId, Collection.id))
			.where(eq(ResourceCollection.resourceId, resource.id)),
		db
			.select({
				relatedSlug: Resource.slug,
				relationType: ResourceRelation.relationType,
			})
			.from(ResourceRelation)
			.innerJoin(Resource, eq(ResourceRelation.relatedResourceId, Resource.id))
			.where(eq(ResourceRelation.resourceId, resource.id)),
	]);

	// Build Tool object
	const tool: Tool = {
		name: resource.name,
		slug: resource.slug,
		description: resource.description,
		url: resource.url,
		image: resource.image ?? undefined,
		icon: resource.icon ?? undefined,
		category: categories.map((c) => c.name) as CategoryType[],
		targetAudience: audiences.map((a) => a.name) as AudienceType[],
		collections: collections.map((c) => c.name) as Tool['collections'],
		topic: resource.topic,
		main_features: features.map((f) => ({
			feature: f.feature,
			description: f.description,
		})),
		tags: tags.map((t) => t.name),
		pricing: resource.pricing as Tool['pricing'],
		og: og
			? {
					title: og.title ?? undefined,
					url: og.url ?? undefined,
					image: og.image ?? undefined,
					type: og.type ?? undefined,
					site_name: og.siteName ?? undefined,
					description: og.description ?? undefined,
					icon: og.icon ?? undefined,
					video: og.video ?? undefined,
				}
			: undefined,
		status: resource.status as Tool['status'],
		lastCheckedAt: resource.lastCheckedAt?.toISOString() ?? undefined,
		verifiedByTeam: resource.verifiedByTeam,
		license: resource.license ?? undefined,
		codeRepository: resource.codeRepository ?? undefined,
		apiAvailable: resource.apiAvailable ?? undefined,
		requiresAuth: resource.requiresAuth ?? undefined,
		relatedTools: relations.filter((r) => r.relationType === 'related').map((r) => r.relatedSlug),
		integrations: relations
			.filter((r) => r.relationType === 'integration')
			.map((r) => r.relatedSlug),
		createdAt: resource.createdAt.toISOString(),
		updatedAt: resource.updatedAt.toISOString(),
	};

	return tool;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get all resources as Tool objects
 */
export async function getAllResources(): Promise<Tool[]> {
	const resources = await db.select().from(Resource);
	return Promise.all(resources.map(transformToTool));
}

/**
 * Get a single resource by slug
 */
export async function getResourceBySlug(slug: string): Promise<Tool | null> {
	const resource = await db.select().from(Resource).where(eq(Resource.slug, slug)).get();
	if (!resource) return null;
	return transformToTool(resource);
}

/**
 * Get a single resource by URL
 */
export async function getResourceByUrl(url: string): Promise<Tool | null> {
	const resource = await db.select().from(Resource).where(eq(Resource.url, url)).get();
	if (!resource) return null;
	return transformToTool(resource);
}

/**
 * Get resources by category
 */
export async function getResourcesByCategory(categoryName: string): Promise<Tool[]> {
	const category = await db
		.select()
		.from(Category)
		.where(eq(Category.name, categoryName))
		.get();
	if (!category) return [];

	const resourceIds = await db
		.select({ resourceId: ResourceCategory.resourceId })
		.from(ResourceCategory)
		.where(eq(ResourceCategory.categoryId, category.id));

	const resources = await Promise.all(
		resourceIds.map(async ({ resourceId }) => {
			const resource = await db.select().from(Resource).where(eq(Resource.id, resourceId)).get();
			return resource ? transformToTool(resource) : null;
		})
	);

	return resources.filter((r): r is Tool => r !== null);
}

/**
 * Get resources by tag
 */
export async function getResourcesByTag(tagName: string): Promise<Tool[]> {
	const tag = await db.select().from(Tag).where(eq(Tag.name, tagName)).get();
	if (!tag) return [];

	const resourceIds = await db
		.select({ resourceId: ResourceTag.resourceId })
		.from(ResourceTag)
		.where(eq(ResourceTag.tagId, tag.id));

	const resources = await Promise.all(
		resourceIds.map(async ({ resourceId }) => {
			const resource = await db.select().from(Resource).where(eq(Resource.id, resourceId)).get();
			return resource ? transformToTool(resource) : null;
		})
	);

	return resources.filter((r): r is Tool => r !== null);
}

/**
 * Get resources by target audience
 */
export async function getResourcesByAudience(audienceName: string): Promise<Tool[]> {
	const audience = await db
		.select()
		.from(TargetAudience)
		.where(eq(TargetAudience.name, audienceName))
		.get();
	if (!audience) return [];

	const resourceIds = await db
		.select({ resourceId: ResourceAudience.resourceId })
		.from(ResourceAudience)
		.where(eq(ResourceAudience.audienceId, audience.id));

	const resources = await Promise.all(
		resourceIds.map(async ({ resourceId }) => {
			const resource = await db.select().from(Resource).where(eq(Resource.id, resourceId)).get();
			return resource ? transformToTool(resource) : null;
		})
	);

	return resources.filter((r): r is Tool => r !== null);
}

/**
 * Get resources by collection
 */
export async function getResourcesByCollection(collectionName: string): Promise<Tool[]> {
	const collection = await db
		.select()
		.from(Collection)
		.where(eq(Collection.name, collectionName))
		.get();
	if (!collection) return [];

	const resourceIds = await db
		.select({ resourceId: ResourceCollection.resourceId })
		.from(ResourceCollection)
		.where(eq(ResourceCollection.collectionId, collection.id));

	const resources = await Promise.all(
		resourceIds.map(async ({ resourceId }) => {
			const resource = await db.select().from(Resource).where(eq(Resource.id, resourceId)).get();
			return resource ? transformToTool(resource) : null;
		})
	);

	return resources.filter((r): r is Tool => r !== null);
}

/**
 * Search resources by name or description
 */
export async function searchResources(query: string): Promise<Tool[]> {
	const lowerQuery = query.toLowerCase();
	const allResources = await db.select().from(Resource);

	const matching = allResources.filter(
		(r) =>
			r.name.toLowerCase().includes(lowerQuery) ||
			r.description.toLowerCase().includes(lowerQuery)
	);

	return Promise.all(matching.map(transformToTool));
}

// ============================================================================
// Mutation Functions (for scripts)
// ============================================================================

/**
 * Insert a new resource
 * Returns the inserted resource ID
 */
export async function insertResource(tool: ToolInput): Promise<number> {
	const now = new Date();
	const slug = tool.slug ?? slugify(tool.name);

	// Insert main resource
	const result = await db
		.insert(Resource)
		.values({
			name: tool.name,
			slug,
			description: tool.description,
			url: tool.url,
			image: tool.image,
			icon: tool.icon,
			topic: tool.topic,
			pricing: tool.pricing,
			status: tool.status ?? 'active',
			license: tool.license,
			codeRepository: tool.codeRepository,
			apiAvailable: tool.apiAvailable ?? false,
			requiresAuth: tool.requiresAuth ?? false,
			verifiedByTeam: tool.verifiedByTeam ?? false,
			lastCheckedAt: tool.lastCheckedAt ? new Date(tool.lastCheckedAt) : null,
			createdAt: now,
			updatedAt: now,
		})
		.returning({ id: Resource.id });

	const resourceId = result[0].id;

	// Insert OG data if provided
	if (tool.og) {
		await db.insert(ResourceOg).values({
			resourceId,
			title: tool.og.title,
			url: tool.og.url,
			image: tool.og.image,
			type: tool.og.type,
			siteName: tool.og.site_name,
			description: tool.og.description,
			icon: tool.og.icon,
			video: tool.og.video,
		});
	}

	// Insert features
	if (tool.main_features && tool.main_features.length > 0) {
		await db.insert(ResourceFeature).values(
			tool.main_features.map((f) => ({
				resourceId,
				feature: f.feature,
				description: f.description,
			}))
		);
	}

	// Insert category relations
	if (tool.category && tool.category.length > 0) {
		for (const catName of tool.category) {
			const cat = await db.select().from(Category).where(eq(Category.name, catName)).get();
			if (cat) {
				await db.insert(ResourceCategory).values({
					resourceId,
					categoryId: cat.id,
				});
			}
		}
	}

	// Insert tags (create if not exists)
	if (tool.tags && tool.tags.length > 0) {
		for (const tagName of tool.tags) {
			let tag = await db.select().from(Tag).where(eq(Tag.name, tagName)).get();
			if (!tag) {
				const inserted = await db
					.insert(Tag)
					.values({
						name: tagName,
						slug: slugify(tagName),
					})
					.returning({ id: Tag.id });
				tag = { id: inserted[0].id, name: tagName, slug: slugify(tagName) };
			}
			await db.insert(ResourceTag).values({
				resourceId,
				tagId: tag.id,
			});
		}
	}

	// Insert audience relations
	if (tool.targetAudience && tool.targetAudience.length > 0) {
		for (const audName of tool.targetAudience) {
			const aud = await db.select().from(TargetAudience).where(eq(TargetAudience.name, audName)).get();
			if (aud) {
				await db.insert(ResourceAudience).values({
					resourceId,
					audienceId: aud.id,
				});
			}
		}
	}

	// Insert collection relations
	if (tool.collections && tool.collections.length > 0) {
		for (const colName of tool.collections) {
			const col = await db.select().from(Collection).where(eq(Collection.name, colName)).get();
			if (col) {
				await db.insert(ResourceCollection).values({
					resourceId,
					collectionId: col.id,
				});
			}
		}
	}

	return resourceId;
}

/**
 * Update an existing resource
 */
export async function updateResource(id: number, updates: Partial<ToolInput>): Promise<void> {
	const now = new Date();

	// Update main resource fields
	const resourceUpdates: Partial<ResourceRow> = {
		updatedAt: now,
	};

	if (updates.name !== undefined) resourceUpdates.name = updates.name;
	if (updates.description !== undefined) resourceUpdates.description = updates.description;
	if (updates.url !== undefined) resourceUpdates.url = updates.url;
	if (updates.image !== undefined) resourceUpdates.image = updates.image;
	if (updates.icon !== undefined) resourceUpdates.icon = updates.icon;
	if (updates.topic !== undefined) resourceUpdates.topic = updates.topic;
	if (updates.pricing !== undefined) resourceUpdates.pricing = updates.pricing;
	if (updates.status !== undefined) resourceUpdates.status = updates.status;
	if (updates.license !== undefined) resourceUpdates.license = updates.license;
	if (updates.codeRepository !== undefined) resourceUpdates.codeRepository = updates.codeRepository;
	if (updates.apiAvailable !== undefined) resourceUpdates.apiAvailable = updates.apiAvailable;
	if (updates.requiresAuth !== undefined) resourceUpdates.requiresAuth = updates.requiresAuth;
	if (updates.verifiedByTeam !== undefined) resourceUpdates.verifiedByTeam = updates.verifiedByTeam;
	if (updates.lastCheckedAt !== undefined)
		resourceUpdates.lastCheckedAt = new Date(updates.lastCheckedAt);

	await db.update(Resource).set(resourceUpdates).where(eq(Resource.id, id));
}

/**
 * Delete a resource and all related data
 */
export async function deleteResource(id: number): Promise<void> {
	// Delete related data first (cascade)
	await db.delete(ResourceOg).where(eq(ResourceOg.resourceId, id));
	await db.delete(ResourceFeature).where(eq(ResourceFeature.resourceId, id));
	await db.delete(ResourceCategory).where(eq(ResourceCategory.resourceId, id));
	await db.delete(ResourceTag).where(eq(ResourceTag.resourceId, id));
	await db.delete(ResourceAudience).where(eq(ResourceAudience.resourceId, id));
	await db.delete(ResourceCollection).where(eq(ResourceCollection.resourceId, id));
	await db.delete(ResourceRelation).where(eq(ResourceRelation.resourceId, id));

	// Delete main resource
	await db.delete(Resource).where(eq(Resource.id, id));
}

// ============================================================================
// Lookup Table Queries
// ============================================================================

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<CategoryRow[]> {
	return db.select().from(Category);
}

/**
 * Get all tags
 */
export async function getAllTags(): Promise<TagRow[]> {
	return db.select().from(Tag);
}

/**
 * Get all target audiences
 */
export async function getAllAudiences(): Promise<TargetAudienceRow[]> {
	return db.select().from(TargetAudience);
}

/**
 * Get all collections
 */
export async function getAllCollections(): Promise<CollectionRow[]> {
	return db.select().from(Collection);
}

/**
 * Get category with resource count
 */
export async function getCategoryWithCount(
	categoryName: string
): Promise<{ category: CategoryRow; count: number } | null> {
	const category = await db.select().from(Category).where(eq(Category.name, categoryName)).get();
	if (!category) return null;

	const resources = await db
		.select()
		.from(ResourceCategory)
		.where(eq(ResourceCategory.categoryId, category.id));

	return { category, count: resources.length };
}
