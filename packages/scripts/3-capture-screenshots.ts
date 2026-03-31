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

import { createHash } from "crypto";
import { SCRIPTS_CONFIG } from "./config";
import {
  logger,
  browserPool,
  closeBrowserOnExit,
  fileIO,
  setupGracefulShutdown,
  updateShutdownStats,
} from "./utils";
import type { ResourceWithAI, ResourceWithScreenshot } from "./types";
import type { Page } from "playwright";

/**
 * Generate a safe filename from URL
 */
function generateScreenshotFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "").replace(/\./g, "-");
    const hash = createHash("sha256").update(url).digest("hex").substring(0, 8);
    return `${hostname}-${hash}.jpg`;
  } catch {
    const hash = createHash("sha256").update(url).digest("hex").substring(0, 8);
    return `resource-${hash}.jpg`;
  }
}

/**
 * Dismiss cookie banners and modals before screenshotting
 */
async function dismissOverlays(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      const acceptPattern = /^(accept|accept all|accept cookies|agree|allow|allow all|ok|got it|continue|i agree|consent)/i;
      const closePattern = /^(close|×|✕|dismiss|no thanks|skip)/i;

      const clickables = document.querySelectorAll<HTMLElement>(
        'button, a[role="button"], [role="button"]',
      );

      for (const el of clickables) {
        const text = el.textContent?.trim() ?? "";
        if (acceptPattern.test(text) || closePattern.test(text)) {
          el.click();
          return;
        }
      }
    });
    await page.waitForTimeout(400);
  } catch {
    // best-effort — never block the screenshot
  }
}

/**
 * Process a single resource: use OG image if available, otherwise capture screenshot
 */
async function processResource(
  resource: ResourceWithAI,
): Promise<ResourceWithScreenshot> {
  const base = { ...resource, screenshot_at: new Date().toISOString() };

  if (resource.og?.image) {
    logger.networkSuccess(resource.url, "fetch", ["image"], 200);
    return {
      ...base,
      image: resource.og?.image,
      image_source: "og",
    } as ResourceWithScreenshot;
  }

  try {
    const page = await browserPool.getPage();
    const response = await page.goto(resource.url, {
      waitUntil: "networkidle",
      timeout: SCRIPTS_CONFIG.og.navigateTimeout,
    });

    if (!response) throw new Error(`No response for ${resource.url}`);

    const status = response.status();
    if (status >= 300 && status < 400) {
      const location = response.headers()["location"] || "";
      throw new Error(`REDIRECT ${status} ${location}`);
    }
    if (status >= 400 && status < 500) {
      throw new Error(`HTTP_4XX ${status}`);
    }

    await page.waitForTimeout(1000);
    await dismissOverlays(page);

    const filename = generateScreenshotFilename(resource.url);
    await page.screenshot({
      path: `${SCRIPTS_CONFIG.paths.screenshots.directory}/${filename}`,
      type: "jpeg",
      quality: SCRIPTS_CONFIG.screenshot.quality,
      fullPage: SCRIPTS_CONFIG.screenshot.fullPage,
    });

    const image = `${SCRIPTS_CONFIG.paths.screenshots.publicPath}/${filename}`;
    logger.networkSuccess(
      resource.url,
      "playwright",
      ["image", "screenshot"],
      200,
      "Navigate",
    );
    return {
      ...base,
      image,
      image_source: "screenshot",
    } as ResourceWithScreenshot;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.startsWith("REDIRECT") || msg.startsWith("HTTP_4XX")) {
      throw error;
    }

    logger.networkError(
      resource.url,
      "playwright",
      error instanceof Error ? error : new Error(msg),
      undefined,
      ["image", "screenshot"],
      "Navigate",
    );
    logger.warning(`No image available for ${resource.url}`);
    return { ...base, image_source: "none" } as ResourceWithScreenshot;
  }
}

/**
 * Main function
 */
async function main() {
  setupGracefulShutdown();

  logger.section("Screenshot Capture");

  try {
    logger.info("Validating configuration...");
    await fileIO.ensureParentDir(SCRIPTS_CONFIG.paths.output.withScreenshots);
    await fileIO.ensureDir(SCRIPTS_CONFIG.paths.screenshots.directory);

    logger.info("Initializing browser...");
    closeBrowserOnExit(browserPool);

    logger.info("Loading enriched data from step 2...");
    const enrichedData = await fileIO.readJSONArray<ResourceWithAI>(
      SCRIPTS_CONFIG.paths.output.aiEnriched,
    );

    if (enrichedData.length === 0) {
      logger.error("No enriched data found. Please run 2-enrich-ai.ts first.");
      process.exit(1);
    }

    logger.success(`Loaded ${enrichedData.length} resources`);

    logger.info("Loading existing screenshot data...");
    const existingWithScreenshots =
      await fileIO.readJSONArray<ResourceWithScreenshot>(
        SCRIPTS_CONFIG.paths.output.backupScreenshots,
      );
    const processedUrls = new Set(existingWithScreenshots.map((r) => r.url));

    const resourcesToProcess = enrichedData.filter(
      (r) => !processedUrls.has(r.url),
    );
    logger.info(
      `${resourcesToProcess.length} resources to process (${processedUrls.size} already done)`,
    );

    if (resourcesToProcess.length === 0) {
      logger.success("All resources already processed!");
      await browserPool.close();
      return;
    }

    logger.section("Processing Resources");
    const successful: ResourceWithScreenshot[] = [];
    const failed: Array<{ url: string; error: string; timestamp: string }> = [];

    for (let i = 0; i < resourcesToProcess.length; i++) {
      const resource = resourcesToProcess[i];
      logger.info(
        `Processing ${i + 1}/${resourcesToProcess.length}: ${resource.url}`,
      );

      try {
        const withScreenshot = await processResource(resource);
        successful.push(withScreenshot);
        await fileIO.appendToJSONArray(
          SCRIPTS_CONFIG.paths.output.backupScreenshots,
          withScreenshot,
        );
        updateShutdownStats({
          totalProcessed: i + 1,
          successful: successful.length,
          failed: failed.length,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (err.message.startsWith("REDIRECT")) {
          const [, status, location] = err.message.split(" ");
          await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.redirectScreenshots, {
            url: resource.url, status: parseInt(status), location, timestamp: new Date().toISOString(),
          });
          logger.itemStatus("warning", resource.url, err.message);
        } else if (err.message.startsWith("HTTP_4XX")) {
          const status = parseInt(err.message.split(" ")[1]);
          await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.errorScreenshots, {
            url: resource.url, status, timestamp: new Date().toISOString(),
          });
          logger.itemStatus("error", resource.url, `HTTP ${status}`);
        } else {
          logger.error(`Failed to process ${resource.url}: ${err.message}`);
          const failedEntry = { url: resource.url, error: err.message, timestamp: new Date().toISOString() };
          failed.push(failedEntry);
          await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.failedScreenshots, failedEntry);
        }

        updateShutdownStats({
          totalProcessed: i + 1,
          successful: successful.length,
          failed: failed.length,
        });
      }
    }

    const allWithScreenshots = [...existingWithScreenshots, ...successful];

    logger.section("Saving Results");
    await fileIO.writeJSON(
      SCRIPTS_CONFIG.paths.output.withScreenshots,
      allWithScreenshots,
    );

    const withImages = successful.filter((r) => r.image).length;
    const withOG = successful.filter((r) => r.image_source === "og").length;
    const withScreenshots = successful.filter(
      (r) => r.image_source === "screenshot",
    ).length;

    logger.section("Summary");
    logger.table({
      "Total resources": enrichedData.length,
      "Successfully processed": successful.length,
      Failed: failed.length,
      "With images": withImages,
      "From OG metadata": withOG,
      "From screenshots": withScreenshots,
      "Already processed": processedUrls.size,
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

    const fileInfo = await fileIO.getFileInfo(
      SCRIPTS_CONFIG.paths.output.withScreenshots,
    );
    if (fileInfo) {
      logger.success(
        `Output saved: ${SCRIPTS_CONFIG.paths.output.withScreenshots} (${fileInfo.sizeFormatted})`,
      );
    }

    logger.success("✓ Step 3 complete! Output: withScreenshots.json");
    logger.info("Next step: Run 4-merge-data.ts to prepare final data");
  } catch (error) {
    logger.error("Fatal error", error);
    process.exit(1);
  } finally {
    await browserPool.close();
  }
}

main().catch((error) => {
  logger.error("Unhandled error", error);
  process.exit(1);
});
