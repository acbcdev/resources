#!/usr/bin/env bun
/**
 * Step 3: Screenshot Capture
 *
 * Input: aiEnriched.json (from step 2)
 * Output: withScreenshots.json (with image field populated)
 * Backup: backupScreenshots.json (incremental saves for resume)
 * Screenshots: /public/screenshots/*.jpeg
 *
 * This script:
 * - Loads AI-enriched data from step 2
 * - Checks if resource has OG image (if yes, use that)
 * - If no OG image, captures screenshot with Playwright
 * - Saves screenshots to /public/screenshots/
 * - Updates image field with public path
 * - Saves incrementally for resume capability
 */

import { createHash } from 'crypto';
import type { Page } from 'playwright';
import { SCRIPTS_CONFIG } from './config';
import { logger, browserPool, closeBrowserOnExit, fileIO, withRetry, batchExecuteWithRetry, setupGracefulShutdown, updateShutdownStats } from './utils';
import type { ResourceWithAI, ResourceWithScreenshot } from './types';

/**
 * Generate a safe filename from URL
 */
function generateScreenshotFilename(url: string): string {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.replace(/^www\./, '').replace(/\./g, '-');
		const hash = createHash('sha256').update(url).digest('hex').substring(0, 8);
		return `${hostname}-${hash}.jpg`;
	} catch {
		const hash = createHash('sha256').update(url).digest('hex').substring(0, 8);
		return `resource-${hash}.jpg`;
	}
}

/**
 * Capture screenshot for a URL
 */
async function captureScreenshot(page: Page, url: string): Promise<string | null> {
	try {
		// Navigate to URL
		const navigated = await browserPool.navigateToURL(page, url);
		if (!navigated) {
			throw new Error(`Failed to navigate to ${url}`);
		}

		// Wait a bit for page to fully render
		await page.waitForTimeout(1000);

		// Generate filename
		const filename = generateScreenshotFilename(url);
		const filepath = `${SCRIPTS_CONFIG.paths.screenshots.directory}/${filename}`;

		// Capture screenshot
		await page.screenshot({
			path: filepath,
			type: 'jpeg',
			quality: SCRIPTS_CONFIG.screenshot.quality,
			fullPage: SCRIPTS_CONFIG.screenshot.fullPage,
		});

		const fieldsFound = ['image', 'screenshot'];
		logger.networkSuccess(url, 'playwright', fieldsFound, 200, 'Navigate');
		// Return public path
		return `${SCRIPTS_CONFIG.paths.screenshots.publicPath}/${filename}`;
	} catch (error) {
		const fieldsAttempted = ['image', 'screenshot'];
		logger.networkError(url, 'playwright', error, undefined, fieldsAttempted, 'Navigate');
		return null;
	}
}

/**
 * Process a single resource (add screenshot if needed)
 */
async function processResourceForScreenshot(
	resource: ResourceWithAI,
): Promise<ResourceWithScreenshot> {
	// If resource already has an image, use it
	const existingImage = resource.og.image;
	if (existingImage) {
		logger.networkSuccess(resource.url, 'fetch', ['image'], 200);
		return {
			...resource,
			image: existingImage,
			image_source: 'og',
			screenshot_at: new Date().toISOString(),
		} as ResourceWithScreenshot;
	}

	// Otherwise, try to capture screenshot
	return withRetry(
		async () => {
			const page = await browserPool.getPage();
			const screenshotPath = await captureScreenshot(page, resource.url);

			if (!screenshotPath) {
				// Screenshot failed, use placeholder
				logger.warning(`No image available for ${resource.url}`);
				return {
					...resource,
					image_source: 'none',
					screenshot_at: new Date().toISOString(),
				} as ResourceWithScreenshot;
			}

			return {
				...resource,
				image: screenshotPath,
				image_source: 'screenshot',
				screenshot_at: new Date().toISOString(),
			} as ResourceWithScreenshot;
		},
		`Capture screenshot for ${resource.url}`,
		{ maxAttempts: 2 },
	);
}

/**
 * Main function
 */
async function main() {
	// Setup graceful shutdown handler
	setupGracefulShutdown();

	logger.section('Screenshot Capture');

	try {
		// Validate configuration
		logger.info('Validating configuration...');
		// Ensure parent directory exists for output files
		await fileIO.ensureParentDir(SCRIPTS_CONFIG.paths.output.withScreenshots);
		await fileIO.ensureDir(SCRIPTS_CONFIG.paths.screenshots.directory);

		// Initialize browser
		logger.info('Initializing browser...');
		closeBrowserOnExit(browserPool);

		// Load enriched data from step 2
		logger.info('Loading enriched data from step 2...');
		const enrichedData = await fileIO.readJSONArray<ResourceWithAI>(
			SCRIPTS_CONFIG.paths.output.aiEnriched,
		);

		if (enrichedData.length === 0) {
			logger.error('No enriched data found. Please run 2-enrich-ai.ts first.');
			process.exit(1);
		}

		logger.success(`Loaded ${enrichedData.length} resources`);

		// Load existing screenshot data to skip processed resources
		logger.info('Loading existing screenshot data...');
		const existingWithScreenshots = await fileIO.readJSONArray<ResourceWithScreenshot>(
			SCRIPTS_CONFIG.paths.output.withScreenshots,
		);
		const processedUrls = new Set(existingWithScreenshots.map((r) => r.url));

		// Filter to un-processed resources
		const resourcesToProcess = enrichedData.filter((r) => !processedUrls.has(r.url));
		logger.info(
			`${resourcesToProcess.length} resources to process (${processedUrls.size} already done)`,
		);

		if (resourcesToProcess.length === 0) {
			logger.success('All resources already processed!');
			await browserPool.close();
			return;
		}

		// Process with retry and error handling
		logger.section('Processing Resources');
		let processedCount = 0;
		let successCount = 0;
		const results = await batchExecuteWithRetry(
			resourcesToProcess,
			async (resource) => {
				const withScreenshot = await processResourceForScreenshot(resource);
				// Save incrementally
				await fileIO.appendToJSONArray(
					SCRIPTS_CONFIG.paths.output.backupScreenshots,
					withScreenshot,
				);
				return withScreenshot;
			},
			{
				maxAttempts: 2,
				onProgress: (current, total) => {
					logger.progress(current, total, 'Processing');
					// Track for shutdown stats
					processedCount = current;
					successCount = current - (results?.failed?.length || 0);
					updateShutdownStats({
						totalProcessed: processedCount,
						successful: successCount,
						failed: results?.failed?.length || 0,
					});
				},
			},
		);

		// Combine existing with new processed data
		const allWithScreenshots = [...existingWithScreenshots, ...results.successful];

		// Save final output
		logger.section('Saving Results');
		await fileIO.writeJSON(SCRIPTS_CONFIG.paths.output.withScreenshots, allWithScreenshots);

		// Count screenshots
		const withImages = results.successful.filter((r) => r.image).length;
		const withOG = results.successful.filter((r) => r.image_source === 'og').length;
		const withScreenshots = results.successful.filter(
			(r) => r.image_source === 'screenshot',
		).length;

		// Log results
		logger.section('Summary');
		logger.table({
			'Total resources': enrichedData.length,
			'Successfully processed': results.successful.length,
			Failed: results.failed.length,
			'With images': withImages,
			'From OG metadata': withOG,
			'From screenshots': withScreenshots,
			'Already processed': processedUrls.size,
		});

		if (results.failed.length > 0) {
			logger.warning(`${results.failed.length} resources failed:`);
			for (const { item: resource, error } of results.failed.slice(0, 5)) {
				logger.warning(`  - ${resource.url}: ${error.message}`);
			}
			if (results.failed.length > 5) {
				logger.warning(`  ... and ${results.failed.length - 5} more`);
			}
		}

		// Show file info
		const fileInfo = await fileIO.getFileInfo(SCRIPTS_CONFIG.paths.output.withScreenshots);
		if (fileInfo) {
			logger.success(
				`Output saved: ${SCRIPTS_CONFIG.paths.output.withScreenshots} (${fileInfo.sizeFormatted})`,
			);
		}

		logger.success('✓ Step 3 complete! Output: withScreenshots.json');
		logger.info('Next step: Run 4-merge-data.ts to prepare final data');
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
