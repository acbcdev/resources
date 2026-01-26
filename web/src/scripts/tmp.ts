#!/usr/bin/env bun
/**
 * Utility script: Extract unique URLs from all data sources
 * Generates new.json for OG extraction pipeline
 */

import { resolve } from 'path';
import { fileIO, logger } from './utils';

async function main() {
	logger.section('Extract Unique URLs');

	try {
		const dataDir = resolve(import.meta.dir, '../data');

		// Read all data sources
		logger.info('Reading data sources...');
		// data.json and data2.json contain URL strings, pending.json contains objects with url property
		const dataContent = await fileIO.readJSONArray<string | { url: string }>(resolve(dataDir, 'data.json'));
		const data2Content = await fileIO.readJSONArray<string | { url: string }>(resolve(dataDir, 'data2.json'));
		const pendingContent = await fileIO.readJSONArray<{ url: string }>(resolve(dataDir, 'pending.json'));

		// Extract URLs (handle both string and object formats)
		const extractUrls = (items: (string | { url: string })[]): string[] =>
			items.map((item) => (typeof item === 'string' ? item : item.url)).filter(Boolean);

		const allUrls = [
			...extractUrls(dataContent),
			...extractUrls(data2Content),
			...extractUrls(pendingContent),
		];

		logger.info(`Total URLs from all sources: ${allUrls.length}`);
		logger.info(`Unique URLs: ${new Set(allUrls).size}`);

		// Get unique URLs
		const uniqueUrls = Array.from(new Set(allUrls));

		logger.info(`Sample (first 10): ${JSON.stringify(uniqueUrls.slice(0, 10), null, 2)}`);

		// Write to new.json using Bun
		const outputPath = resolve(dataDir, 'new.json');
		await Bun.write(outputPath, JSON.stringify(uniqueUrls, null, 2));

		logger.success(`✓ Unique URLs saved to: ${outputPath} (${uniqueUrls.length} URLs)`);
	} catch (error) {
		logger.error('Fatal error', error);
		process.exit(1);
	}
}

main().catch((error) => {
	logger.error('Unhandled error', error);
	process.exit(1);
});
