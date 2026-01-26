#!/usr/bin/env bun
/**
 * Step 4: Merge with Manual Review
 *
 * Input: withScreenshots.json (from step 3) + data.json (existing data)
 * Output: STDOUT (for manual review before merging)
 *
 * This script:
 * - Loads fully processed resources from step 3
 * - Loads existing data.json
 * - Detects duplicates by URL
 * - Adds timestamps (createdAt, updatedAt)
 * - Outputs JSON to STDOUT for manual review
 * - Provides instructions for manual merge
 * - Does NOT auto-write to data.json (safety measure)
 */

import { SCRIPTS_CONFIG } from './config';
import { logger, fileIO } from './utils';
import type { ResourceWithScreenshot, MergedResource } from './types';

interface ExistingResource {
	url: string;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Check if two URLs represent the same resource
 */
function isSameURL(url1: string, url2: string): boolean {
	try {
		// Normalize URLs for comparison
		const u1 = new URL(url1);
		const u2 = new URL(url2);

		// Compare protocol, hostname, and pathname
		return (
			u1.protocol === u2.protocol && u1.hostname === u2.hostname && u1.pathname === u2.pathname
		);
	} catch {
		// Fallback to string comparison
		return url1 === url2;
	}
}

/**
 * Main function
 */
async function main() {
	logger.section('Data Merge & Review');

	try {
		// Load processed resources from step 3
		logger.info('Loading processed resources from step 3...');
		const processedResources = await fileIO.readJSONArray<ResourceWithScreenshot>(
			SCRIPTS_CONFIG.paths.output.withScreenshots,
		);

		if (processedResources.length === 0) {
			logger.error('No processed resources found. Please run 3-capture-screenshots.ts first.');
			process.exit(1);
		}

		logger.success(`Loaded ${processedResources.length} processed resources`);

		// Load existing data
		logger.info('Loading existing data.json...');
		const existingData = await fileIO.readJSONArray<ExistingResource>(
			SCRIPTS_CONFIG.paths.input.existingData,
		);

		logger.success(`Loaded ${existingData.length} existing resources`);

		// Detect duplicates and new resources
		const existingUrls = new Map(existingData.map((r) => [r.url, r]));
		const duplicates: ResourceWithScreenshot[] = [];
		const newResources: MergedResource[] = [];

		for (const resource of processedResources) {
			const existingEntry = Array.from(existingUrls.values()).find((existing) =>
				isSameURL(existing.url, resource.url),
			);

			if (existingEntry) {
				duplicates.push(resource);
			} else {
				newResources.push({
					...resource,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				} as MergedResource);
			}
		}

		// Show summary
		logger.section('Analysis');
		logger.table({
			'Total processed': processedResources.length,
			'New resources': newResources.length,
			'Duplicates (skipped)': duplicates.length,
			'Existing in database': existingData.length,
		});

		if (duplicates.length > 0) {
			logger.warning(`${duplicates.length} duplicates detected (will be skipped):`);
			for (const dup of duplicates.slice(0, 5)) {
				logger.warning(`  - ${dup.url}`);
			}
			if (duplicates.length > 5) {
				logger.warning(`  ... and ${duplicates.length - 5} more`);
			}
		}

		// Output for manual review
		logger.section('Merged Data Preview');

		if (newResources.length === 0) {
			logger.warning('No new resources to add (all are duplicates).');
			logger.info('Preview would have been:');
			console.log(JSON.stringify(newResources, null, 2));
		} else {
			logger.success(`Preview of ${newResources.length} new resources:`);
			console.log(JSON.stringify(newResources, null, 2));
		}

		// Save to temporary file for reference
		logger.section('Next Steps');

		const previewPath = `${SCRIPTS_CONFIG.paths.output}/merged-preview-${Date.now()}.json`;
		await fileIO.writeJSON(previewPath, newResources);
		logger.info(`✓ Preview saved to: ${previewPath}`);

		if (newResources.length > 0) {
			logger.success('\n📋 MANUAL MERGE INSTRUCTIONS:');
			console.log(`
1. Review the new resources shown above
2. Copy the new resources from the output above
3. In your data.json file, add these resources to the beginning of the array:

   [
     // Paste the new resources here
     ${JSON.stringify(newResources[0], null, 4).split('\n').join('\n     ')},
     // ... rest of new resources ...
     // ... existing resources ...
   ]

4. Verify the data looks correct
5. Save and commit the updated data.json

⚠️  SAFETY: This script does NOT auto-write to data.json
   You must manually review and merge the resources.
`);
		} else {
			logger.success('\n✓ Step 4 complete! (No new resources to add)');
		}

		logger.success('✓ Merge preview complete!');
	} catch (error) {
		logger.error('Fatal error', error);
		process.exit(1);
	}
}

// Run main function
main().catch((error) => {
	logger.error('Unhandled error', error);
	process.exit(1);
});
