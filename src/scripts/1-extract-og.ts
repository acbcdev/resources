#!/usr/bin/env bun
/**
 * Step 1: Extract Open Graph Metadata
 *
 * Input: new.json (array of URL strings)
 * Output: ogData.json (array of ResourceWithOG)
 * Backup: backupOG.json (incremental saves for resume)
 *
 * This script:
 * - Launches a single shared browser instance
 * - Navigates to each URL
 * - Extracts OG metadata using page.evaluate()
 * - Extracts favicon URL
 * - Saves incrementally to backup for resume capability
 */

import { type Page } from 'playwright';
import { SCRIPTS_CONFIG } from './config';
import { logger, browserPool, closeBrowserOnExit, fileIO, withRetry, batchExecuteWithRetry } from './utils';
import type { ResourceWithOG } from './types';

interface OGExtractionResult {
	title?: string;
	url?: string;
	image?: string;
	description?: string;
	type?: string;
	site_name?: string;
	video?: string;
	icon?: string;
}

/**
 * Extract OG metadata from a page
 */
async function extractOGMetadata(page: Page): Promise<OGExtractionResult> {
	return page.evaluate(() => {
		const metadata: OGExtractionResult = {};

		// Extract from meta tags
		const metas = document.querySelectorAll('meta');
		for (const meta of metas) {
			const property = meta.getAttribute('property') || meta.getAttribute('name') || '';
			const content = meta.getAttribute('content');

			if (!content) continue;

			if (property === 'og:title') metadata.title = content;
			else if (property === 'og:url') metadata.url = content;
			else if (property === 'og:image') metadata.image = content;
			else if (property === 'og:description') metadata.description = content;
			else if (property === 'og:type') metadata.type = content;
			else if (property === 'og:site_name') metadata.site_name = content;
			else if (property === 'og:video') metadata.video = content;
		}

		// Fallback to title tag
		if (!metadata.title) {
			metadata.title = document.querySelector('title')?.textContent || undefined;
		}

		// Fallback to meta description
		if (!metadata.description) {
			const metaDesc = document.querySelector('meta[name="description"]');
			if (metaDesc) {
				metadata.description = metaDesc.getAttribute('content') || undefined;
			}
		}

		// Extract favicon
		const favicon =
			document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
			document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
			'/favicon.ico';

		if (favicon) {
			metadata.icon = favicon;
		}

		return metadata;
	});
}

/**
 * Extract OG data for a single URL
 */
async function extractOGForURL(url: string): Promise<ResourceWithOG> {
	return withRetry(
		async () => {
			const page = await browserPool.getPage();

			// Navigate to URL
			const navigated = await browserPool.navigateToURL(page, url);
			if (!navigated) {
				throw new Error(`Failed to navigate to ${url}`);
			}

			// Extract OG metadata
			const ogData = await extractOGMetadata(page);

			// Make sure URL is in the data
			if (!ogData.url) {
				ogData.url = url;
			}

			return {
				url,
				og: ogData,
				extracted_at: new Date().toISOString(),
			};
		},
		`Extract OG for ${url}`,
		{ maxAttempts: 3 },
	);
}

/**
 * Main function
 */
async function main() {
	logger.section('Open Graph Metadata Extraction');

	try {
		// Validate configuration
		logger.info('Validating configuration...');
		// Ensure parent directory exists for output files
		await fileIO.ensureParentDir(SCRIPTS_CONFIG.paths.output.ogData);

		// Initialize browser
		logger.info('Initializing browser...');
		closeBrowserOnExit(browserPool);

		// Load URLs to process
		logger.info('Loading URLs from new.json...');
		const allUrls = await fileIO.readJSONArray<string>(SCRIPTS_CONFIG.paths.input.newUrls);
		logger.success(`Loaded ${allUrls.length} URLs`);

		// Load existing backup to skip processed URLs
		logger.info('Loading existing backup...');
		const existingData = await fileIO.readJSONArray<ResourceWithOG>(
			SCRIPTS_CONFIG.paths.output.backupOG,
		);
		const existingUrls = new Set(existingData.map((r) => r.url));

		// Filter to unprocessed URLs
		const urlsToProcess = allUrls.filter((url) => !existingUrls.has(url));
		logger.info(`${urlsToProcess.length} new URLs to process (${existingUrls.size} already done)`);

		if (urlsToProcess.length === 0) {
			logger.success('All URLs already processed!');
			await browserPool.close();
			return;
		}

		// Process URLs with retry and error handling
		logger.section('Processing URLs');
		const results = await batchExecuteWithRetry(
			urlsToProcess,
			async (url) => {
				const result = await extractOGForURL(url);
				// Save incrementally
				await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.backupOG, result);
				return result;
			},
			{
				maxAttempts: 3,
				onProgress: (current, total) => {
					logger.progress(current, total, 'Processing');
				},
			},
		);

		// Combine existing data with new data
		const allData = [...existingData, ...results.successful];

		// Save final output
		logger.section('Saving Results');
		await fileIO.writeJSON(SCRIPTS_CONFIG.paths.output.ogData, allData);

		// Log results
		logger.section('Summary');
		logger.table({
			'Total URLs': allUrls.length,
			'Successfully processed': results.successful.length,
			Failed: results.failed.length,
			'Already processed': existingUrls.size,
		});

		if (results.failed.length > 0) {
			logger.warning(`${results.failed.length} URLs failed:`);
			for (const { item: url, error } of results.failed.slice(0, 5)) {
				logger.warning(`  - ${url}: ${error.message}`);
			}
			if (results.failed.length > 5) {
				logger.warning(`  ... and ${results.failed.length - 5} more`);
			}
		}

		// Show file info
		const fileInfo = await fileIO.getFileInfo(SCRIPTS_CONFIG.paths.output.ogData);
		if (fileInfo) {
			logger.success(
				`Output saved: ${SCRIPTS_CONFIG.paths.output.ogData} (${fileInfo.sizeFormatted}, ${fileInfo.count} items)`,
			);
		}

		logger.success('✓ Step 1 complete! Output: ogData.json');
		logger.info('Next step: Run 2-enrich-ai.ts to add AI metadata');
	} catch (error) {
		logger.error('Fatal error', error);
		process.exit(1);
	} finally {
		await browserPool.close();
	}
}

// Run main function
main().catch((error) => {
	logger.error('Unhandled error', error);
	process.exit(1);
});
