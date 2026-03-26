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
import { logger, browserPool, closeBrowserOnExit, fileIO, setupGracefulShutdown, updateShutdownStats } from './utils';
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
		const navigated = await browserPool.navigateToURL(page, url);
		if (!navigated) {
			throw new Error(`Failed to navigate to ${url}`);
		}

		await page.waitForTimeout(1000);

		const filename = generateScreenshotFilename(url);
		const filepath = `${SCRIPTS_CONFIG.paths.screenshots.directory}/${filename}`;

		await page.screenshot({
			path: filepath,
			type: 'jpeg',
			quality: SCRIPTS_CONFIG.screenshot.quality,
			fullPage: SCRIPTS_CONFIG.screenshot.fullPage,
		});

		logger.networkSuccess(url, 'playwright', ['image', 'screenshot'], 200, 'Navigate');
		return `${SCRIPTS_CONFIG.paths.screenshots.publicPath}/${filename}`;
	} catch (error) {
		logger.networkError(url, 'playwright', error instanceof Error ? error : new Error(String(error)), undefined, ['image', 'screenshot'], 'Navigate');
		return null;
	}
}

/**
 * Process a single resource (add screenshot if needed)
 */
async function processResourceForScreenshot(resource: ResourceWithAI): Promise<ResourceWithScreenshot> {
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

	const page = await browserPool.getPage();
	const screenshotPath = await captureScreenshot(page, resource.url);

	if (!screenshotPath) {
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
}

/**
 * Main function
 */
async function main() {
	setupGracefulShutdown();

	logger.section('Screenshot Capture');

	try {
		logger.info('Validating configuration...');
		await fileIO.ensureParentDir(SCRIPTS_CONFIG.paths.output.withScreenshots);
		await fileIO.ensureDir(SCRIPTS_CONFIG.paths.screenshots.directory);

		logger.info('Initializing browser...');
		closeBrowserOnExit(browserPool);

		logger.info('Loading enriched data from step 2...');
		const enrichedData = await fileIO.readJSONArray<ResourceWithAI>(SCRIPTS_CONFIG.paths.output.aiEnriched);

		if (enrichedData.length === 0) {
			logger.error('No enriched data found. Please run 2-enrich-ai.ts first.');
			process.exit(1);
		}

		logger.success(`Loaded ${enrichedData.length} resources`);

		logger.info('Loading existing screenshot data...');
		const existingWithScreenshots = await fileIO.readJSONArray<ResourceWithScreenshot>(
			SCRIPTS_CONFIG.paths.output.withScreenshots,
		);
		const processedUrls = new Set(existingWithScreenshots.map((r) => r.url));

		const resourcesToProcess = enrichedData.filter((r) => !processedUrls.has(r.url));
		logger.info(`${resourcesToProcess.length} resources to process (${processedUrls.size} already done)`);

		if (resourcesToProcess.length === 0) {
			logger.success('All resources already processed!');
			await browserPool.close();
			return;
		}

		logger.section('Processing Resources');
		const successful: ResourceWithScreenshot[] = [];
		const failed: Array<{ url: string; error: string; timestamp: string }> = [];

		for (let i = 0; i < resourcesToProcess.length; i++) {
			const resource = resourcesToProcess[i];
			logger.info(`Processing ${i + 1}/${resourcesToProcess.length}: ${resource.url}`);

			try {
				const withScreenshot = await processResourceForScreenshot(resource);
				successful.push(withScreenshot);
				await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.backupScreenshots, withScreenshot);
				updateShutdownStats({ totalProcessed: i + 1, successful: successful.length, failed: failed.length });
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				logger.error(`Failed to process ${resource.url}: ${errorMsg}`);
				failed.push({ url: resource.url, error: errorMsg, timestamp: new Date().toISOString() });
				updateShutdownStats({ totalProcessed: i + 1, successful: successful.length, failed: failed.length });
			}
		}

		const allWithScreenshots = [...existingWithScreenshots, ...successful];

		logger.section('Saving Results');
		await fileIO.writeJSON(SCRIPTS_CONFIG.paths.output.withScreenshots, allWithScreenshots);

		const withImages = successful.filter((r) => r.image).length;
		const withOG = successful.filter((r) => r.image_source === 'og').length;
		const withScreenshots = successful.filter((r) => r.image_source === 'screenshot').length;

		logger.section('Summary');
		logger.table({
			'Total resources': enrichedData.length,
			'Successfully processed': successful.length,
			Failed: failed.length,
			'With images': withImages,
			'From OG metadata': withOG,
			'From screenshots': withScreenshots,
			'Already processed': processedUrls.size,
		});

		if (failed.length > 0) {
			logger.warning(`${failed.length} resources failed:`);
			for (const { url, error } of failed.slice(0, 5)) {
				logger.warning(`  - ${url}: ${error}`);
			}
			if (failed.length > 5) {
				logger.warning(`  ... and ${failed.length - 5} more`);
			}
		}

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

main().catch((error) => {
	logger.error('Unhandled error', error);
	process.exit(1);
});
