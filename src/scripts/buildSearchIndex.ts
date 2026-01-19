#!/usr/bin/env bun
/**
 * Build-time script to create a lightweight search index
 * Run during the build process to generate public/search-index.json
 *
 * This index contains only essential fields for client-side search:
 * - id, name, url, category, tags (limited), description (truncated)
 */

import { resolve } from 'path';
import { fileIO, logger } from './utils';

// Search index configuration
const MAX_TAGS_IN_INDEX = 5;
const MAX_DESCRIPTION_LENGTH = 150;

interface Resource {
	name: string;
	url: string;
	description: string;
	category: string[];
	tags?: string[];
	og?: {
		image?: string;
		description?: string;
	};
}

interface SearchIndexItem {
	id: number;
	name: string;
	url: string;
	category: string[];
	tags: string[];
	description: string;
}

/**
 * Validate that a resource has complete metadata
 * STRICT validation: all required fields must exist
 */
function hasCompleteMetadata(resource: Resource): boolean {
	return !!(
		resource.name &&
		resource.url &&
		resource.description &&
		resource.og?.image &&
		resource.og?.description
	);
}

/**
 * Build the search index from data
 */
function buildSearchIndex(data: Resource[]): SearchIndexItem[] {
	return data.filter(hasCompleteMetadata).map((resource, index) => ({
		id: index,
		name: resource.name,
		url: resource.url,
		category: resource.category,
		tags: (resource.tags || []).slice(0, MAX_TAGS_IN_INDEX),
		description: (resource.description || '').slice(0, MAX_DESCRIPTION_LENGTH),
	}));
}

/**
 * Main function to generate the index
 */
async function main() {
	logger.section('Build Search Index');

	try {
		// Load data from data.json using fileIO
		const dataPath = resolve(import.meta.dir, '../data/data.json');
		const resources = await fileIO.readJSONArray<Resource>(dataPath);

		if (resources.length === 0) {
			logger.warning('No resources found in data.json');
			return;
		}

		logger.info(`Loaded ${resources.length} resources`);

		const searchIndex = buildSearchIndex(resources);

		// Ensure public directory exists using Bun
		const publicDir = resolve(import.meta.dir, '../../public');
		await fileIO.ensureDir(publicDir);

		// Write index to file using Bun.write
		const indexPath = resolve(publicDir, 'search-index.json');
		await Bun.write(indexPath, JSON.stringify(searchIndex, null, 2));

		logger.section('Summary');
		logger.table({
			'Total resources': resources.length,
			'Indexed resources': searchIndex.length,
			'Output': indexPath,
		});

		logger.success('✓ Search index built successfully');
	} catch (error) {
		logger.error('Failed to build search index', error);
		process.exit(1);
	}
}

main().catch((error) => {
	logger.error('Unhandled error', error);
	process.exit(1);
});
