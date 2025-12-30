/**
 * Build-time script to create a lightweight search index
 * Run during the build process to generate public/search-index.json
 *
 * This index contains only essential fields for client-side search:
 * - id, name, url, category, tags (limited), description (truncated)
 */

import { DATA } from '@/data';
import * as fs from 'fs';
import * as path from 'path';

// Search index configuration
const MAX_TAGS_IN_INDEX = 5;
const MAX_DESCRIPTION_LENGTH = 150;

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
function hasCompleteMetadata(resource: (typeof DATA)[number]): boolean {
	return !!(
		resource.name &&
		resource.url &&
		resource.description &&
		resource.og?.image &&
		resource.og?.description
	);
}

/**
 * Build the search index from DATA
 */
function buildSearchIndex(): SearchIndexItem[] {
	return DATA.filter(hasCompleteMetadata).map((resource, index) => ({
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
	try {
		const searchIndex = buildSearchIndex();

		// Ensure public directory exists
		const publicDir = path.join(process.cwd(), 'public');
		if (!fs.existsSync(publicDir)) {
			fs.mkdirSync(publicDir, { recursive: true });
		}

		// Write index to file
		const indexPath = path.join(publicDir, 'search-index.json');
		fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2));

		console.log(`✓ Search index built successfully`);
		console.log(`  - Total resources: ${DATA.length}`);
		console.log(`  - Indexed resources: ${searchIndex.length}`);
		console.log(`  - Output: ${indexPath}`);
	} catch (error) {
		console.error('✗ Failed to build search index:', error);
		process.exit(1);
	}
}

main();
