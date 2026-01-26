import { column, defineDb, defineTable } from 'astro:db';

// ============================================================================
// Main Resource Table (matches Tool type)
// ============================================================================

export const Resource = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text(),
		slug: column.text({ unique: true }),
		description: column.text(),
		url: column.text({ unique: true }),
		image: column.text({ optional: true }),
		icon: column.text({ optional: true }),
		topic: column.text(),
		pricing: column.text({ optional: true }), // 'Free' | 'Freemium' | 'Paid' | 'Premium' | 'Opensource'
		status: column.text({ default: 'active' }), // 'active' | 'deprecated' | 'beta' | 'sunset'
		license: column.text({ optional: true }),
		codeRepository: column.text({ optional: true }),
		apiAvailable: column.boolean({ default: false }),
		requiresAuth: column.boolean({ default: false }),
		verifiedByTeam: column.boolean({ default: false }),
		lastCheckedAt: column.date({ optional: true }),
		createdAt: column.date(),
		updatedAt: column.date(),
	},
});

// ============================================================================
// Resource OG Metadata (1:1 relationship - matches OgSchema)
// ============================================================================

export const ResourceOg = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		resourceId: column.number({ references: () => Resource.columns.id, unique: true }),
		title: column.text({ optional: true }),
		url: column.text({ optional: true }),
		image: column.text({ optional: true }),
		type: column.text({ optional: true }),
		siteName: column.text({ optional: true }),
		description: column.text({ optional: true }),
		icon: column.text({ optional: true }),
		video: column.text({ optional: true }),
	},
});

// ============================================================================
// Resource Features (1:N relationship - matches FeatureSchema)
// ============================================================================

export const ResourceFeature = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		resourceId: column.number({ references: () => Resource.columns.id }),
		feature: column.text(),
		description: column.text(),
	},
});

// ============================================================================
// Lookup Tables
// ============================================================================

export const Category = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text({ unique: true }),
		slug: column.text({ unique: true }),
		iconName: column.text(), // Lucide icon name for client rendering
	},
});

export const Tag = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text({ unique: true }),
		slug: column.text({ unique: true }),
	},
});

export const TargetAudience = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text({ unique: true }),
	},
});

export const Collection = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text({ unique: true }),
		slug: column.text({ unique: true }),
		description: column.text({ optional: true }),
		image: column.text({ optional: true }),
	},
});

// ============================================================================
// Junction Tables (N:N relationships)
// ============================================================================

export const ResourceCategory = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		resourceId: column.number({ references: () => Resource.columns.id }),
		categoryId: column.number({ references: () => Category.columns.id }),
	},
	indexes: [{ on: ['resourceId', 'categoryId'], unique: true }],
});

export const ResourceTag = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		resourceId: column.number({ references: () => Resource.columns.id }),
		tagId: column.number({ references: () => Tag.columns.id }),
	},
	indexes: [{ on: ['resourceId', 'tagId'], unique: true }],
});

export const ResourceAudience = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		resourceId: column.number({ references: () => Resource.columns.id }),
		audienceId: column.number({ references: () => TargetAudience.columns.id }),
	},
	indexes: [{ on: ['resourceId', 'audienceId'], unique: true }],
});

export const ResourceCollection = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		resourceId: column.number({ references: () => Resource.columns.id }),
		collectionId: column.number({ references: () => Collection.columns.id }),
	},
	indexes: [{ on: ['resourceId', 'collectionId'], unique: true }],
});

// ============================================================================
// Self-referential Relations (relatedTools[] + integrations[])
// ============================================================================

export const ResourceRelation = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		resourceId: column.number({ references: () => Resource.columns.id }),
		relatedResourceId: column.number({ references: () => Resource.columns.id }),
		relationType: column.text(), // 'related' | 'integration'
	},
	indexes: [{ on: ['resourceId', 'relatedResourceId', 'relationType'], unique: true }],
});

// ============================================================================
// Database Export
// ============================================================================

export default defineDb({
	tables: {
		Resource,
		ResourceOg,
		ResourceFeature,
		Category,
		Tag,
		TargetAudience,
		Collection,
		ResourceCategory,
		ResourceTag,
		ResourceAudience,
		ResourceCollection,
		ResourceRelation,
	},
});
