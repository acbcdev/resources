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

import { SCRIPTS_CONFIG } from './config';
import {
	logger,
	browserPool,
	closeBrowserOnExit,
	fileIO,
	setupGracefulShutdown,
	updateShutdownStats,
	httpFetcher,
	metadataExtractor,
} from './utils';
import type { ResourceWithOG, OGMetadata } from './types';

/**
 * Helper: Collect found OG fields for logging
 */
function getFoundFields(ogData: OGMetadata): string[] {
	const fields: string[] = [];
	if (ogData.url) fields.push('url');
	if (ogData.title) fields.push('title');
	if (ogData.description) fields.push('description');
	if (ogData.image) fields.push('image');
	if (ogData.icon) fields.push('icon');
	if (ogData.type) fields.push('type');
	if (ogData.site_name) fields.push('site_name');
	if (ogData.video) fields.push('video');
	return fields;
}

/**
 * Attempt 1: HTTP fetch with Cheerio
 */
async function tryFetch(url: string): Promise<ResourceWithOG | null> {
	try {
		const html = await httpFetcher.fetchHTML(url, SCRIPTS_CONFIG.og.timeout);
		const ogData = await metadataExtractor.extractFromHTML(html, url);

		// Ensure URL is set
		if (!ogData.url) ogData.url = url;

		const foundFields = getFoundFields(ogData);
		logger.networkSuccess(url, 'fetch', foundFields);

		return {
			url,
			og: ogData,
			extraction_method: 'fetch',
			extracted_at: new Date().toISOString(),
		};
	} catch (error) {
		const statusCode =
			error instanceof Error && error.message.includes('HTTP')
				? parseInt(error.message.replace('HTTP ', ''))
				: undefined;
		const attemptedFields = [
			'url',
			'title',
			'description',
			'image',
			'icon',
			'type',
			'site_name',
			'video',
		];
		logger.networkError(
			url,
			'fetch',
			error instanceof Error ? error : new Error(String(error)),
			statusCode,
			attemptedFields,
		);
		return null;
	}
}

/**
 * Capture OG data using browser (opens and closes per URL)
 */
async function capture(url: string, headless: boolean): Promise<ResourceWithOG | null> {
	try {
		const page = await browserPool.getPage(headless);
		const navigated = await browserPool.navigateToURL(page, url);
		if (!navigated) {
			throw new Error(`Failed to navigate to ${url}`);
		}

		const ogData = await metadataExtractor.extractFromPage(page);
		if (!ogData.url) ogData.url = url;

		const foundFields = getFoundFields(ogData);
		const method = headless ? 'playwright' : 'playwright-visible';
		logger.networkSuccess(url, method, foundFields);

		// Close browser after extraction
		await browserPool.close();

		return {
			url,
			og: ogData,
			extraction_method: 'browser',
			extracted_at: new Date().toISOString(),
		};
	} catch (error) {
		// Close browser on error
		await browserPool.close();

		const method = headless ? 'playwright' : 'playwright-visible';
		logger.networkError(
			url,
			method,
			error instanceof Error ? error : new Error(String(error)),
			undefined,
			['url', 'title', 'description', 'image', 'icon', 'type', 'site_name', 'video'],
		);
		return null;
	}
}

/**
 * Extract OG data with simple 3-attempt fallback strategy
 * 1. HTTP fetch with Cheerio
 * 2. Browser (headless)
 * 3. Browser (visible)
 */
async function extractOG(url: string): Promise<ResourceWithOG> {
	// Attempt 1: HTTP Fetch
	if (SCRIPTS_CONFIG.og.useFetchFirst) {
		const result = await tryFetch(url);
		if (result) return result;
		logger.info('Fetch failed, falling back to browser...');
	}

	// Attempt 2: Browser (headless)
	let result = await capture(url, true);
	if (result) return result;

	logger.info('Headless browser failed, retrying in visible mode...');

	// Attempt 3: Browser (visible for debugging)
	result = await capture(url, false);
	if (result) return result;

	// All attempts failed
	throw new Error(`Unable to extract OG data from ${url} after 3 attempts`);
}


/**
 * Main function
 */
async function main() {
	// Setup graceful shutdown handler
	setupGracefulShutdown();

	logger.section('Open Graph Metadata Extraction');

	try {
		// Validate configuration
		logger.info('Validating configuration...');
		// Ensure parent directory exists for output files
		await fileIO.ensureParentDir(SCRIPTS_CONFIG.paths.output.ogData);

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
			return;
		}

		// Process URLs with simple linear fallback (no retry loops)
		logger.section('Processing URLs');
		const startTime = Date.now();
		let processedCount = 0;
		let successCount = 0;
		let failedCount = 0;
		const successfulResults: ResourceWithOG[] = [];
		const failedUrls: Array<{ url: string; error: Error }> = [];

		for (const url of urlsToProcess) {
			try {
				const result = await extractOG(url);
				successfulResults.push(result);
				successCount++;
				if (SCRIPTS_CONFIG.logging.verboseSuccess) {
					logger.itemStatus('success', url, 'Retrieved');
				}
			} catch (error) {
				failedCount++;
				const err = error instanceof Error ? error : new Error(String(error));
				failedUrls.push({ url, error: err });
				logger.itemStatus('error', url, err.message);
			}

			// Save incrementally for resume capability
			if (successfulResults.length > 0) {
				await fileIO.appendToJSONArray(
					SCRIPTS_CONFIG.paths.output.backupOG,
					successfulResults[successfulResults.length - 1],
				);
			}

			// Update progress
			processedCount++;
			logger.progressAdvanced(
				processedCount,
				urlsToProcess.length,
				{ successful: successCount, failed: failedCount, warnings: 0 },
				url,
				startTime,
			);
			updateShutdownStats({
				totalProcessed: processedCount,
				successful: successCount,
				failed: failedCount,
			});
		}

		// Combine existing data with new data
		const allData = [...existingData, ...successfulResults];

		// Save final output
		logger.section('Saving Results');
		await fileIO.writeJSON(SCRIPTS_CONFIG.paths.output.ogData, allData);

		// Log results
		logger.section('Summary');
		logger.tableWithColors({
			'Total URLs': allUrls.length,
			'Successfully processed': successfulResults.length,
			Failed: failedUrls.length,
			'Already processed': existingUrls.size,
		});

		if (failedUrls.length > 0) {
			logger.warning(`${failedUrls.length} URLs failed:`);
			for (const { url, error } of failedUrls.slice(0, 5)) {
				logger.warning(`  - ${url}: ${error.message}`);
			}
			if (failedUrls.length > 5) {
				logger.warning(`  ... and ${failedUrls.length - 5} more`);
			}

			// Save failed URLs to file for tracking
			for (const { url, error } of failedUrls) {
				await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.failedOG, {
					url,
					error: error.message,
					timestamp: new Date().toISOString(),
				});
			}
			logger.info(`Failed URLs saved to: ${SCRIPTS_CONFIG.paths.output.failedOG}`);
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
	}
}

// Run main function
main().catch((error) => {
	logger.error('Unhandled error', error);
	process.exit(1);
});
