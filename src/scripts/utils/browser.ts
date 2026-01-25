import { chromium, type Browser, type Page } from 'playwright';
import { SCRIPTS_CONFIG } from '../config';
import { logger } from './logger';

/**
 * Browser pool manager - maintains a single shared browser instance
 * and provides reusable pages for performance optimization
 */
export class BrowserPool {
	private browser: Browser | null = null;
	private currentPage: Page | null = null;
	private initialized = false;

	/**
	 * Initialize the browser (launch once per script)
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		try {
			logger.debug('Initializing Chromium browser...');

			this.browser = await chromium.launch({
				headless: SCRIPTS_CONFIG.browser.headless,
				args: [...SCRIPTS_CONFIG.browser.args],
			});

			this.initialized = true;
			logger.success('Browser initialized');
		} catch (error) {
			logger.error('Failed to initialize browser', error);
			throw error;
		}
	}

	/**
	 * Get a page instance (reuses existing page, closes previous one)
	 * This is more efficient than creating new browser instances
	 * headless parameter can override config for specific attempts
	 */
	async getPage(headless?: boolean): Promise<Page> {
		const headlessMode = headless !== undefined ? headless : SCRIPTS_CONFIG.browser.headless;

		// If headless mode is different from current browser, reinitialize
		if (this.initialized && this.browser && headlessMode !== SCRIPTS_CONFIG.browser.headless) {
			logger.debug(`Switching browser headless mode to: ${headlessMode}`);
			await this.close();
		}

		if (!this.initialized || !this.browser) {
			logger.debug('Initializing Chromium browser...');
			this.browser = await chromium.launch({
				headless: headlessMode,
				args: [...SCRIPTS_CONFIG.browser.args],
			});
			this.initialized = true;
		}

		// Close previous page if exists
		if (this.currentPage) {
			try {
				await this.currentPage.close();
			} catch {
				// Ignore errors when closing page
			}
		}

		// Create new page context
		const context = await this.browser!.newContext({
			viewport: {
				width: SCRIPTS_CONFIG.browser.viewport.width,
				height: SCRIPTS_CONFIG.browser.viewport.height,
			},
		});

		this.currentPage = await context.newPage();

		// Set timeout for page operations
		this.currentPage.setDefaultTimeout(SCRIPTS_CONFIG.browser.timeout);
		this.currentPage.setDefaultNavigationTimeout(SCRIPTS_CONFIG.network.fetchTimeout);

		return this.currentPage;
	}

	/**
	 * Navigate to a URL safely with error handling
	 */
	async navigateToURL(page: Page, url: string): Promise<boolean> {
		try {
			await page.goto(url, {
				waitUntil: 'networkidle',
				timeout: SCRIPTS_CONFIG.og.navigateTimeout,
			});
			return true;
		} catch (error) {
			if (error instanceof Error) {
				logger.debug(`Navigation failed for ${url}: ${error.message}`);
			}
			return false;
		}
	}

	/**
	 * Close the browser and cleanup
	 */
	async close(): Promise<void> {
		if (!this.browser) {
			return;
		}

		try {
			if (this.currentPage) {
				try {
					await this.currentPage.close();
				} catch {
					// Ignore errors
				}
			}

			await this.browser.close();
			this.browser = null;
			this.currentPage = null;
			this.initialized = false;
		} catch (error) {
			logger.error('Error closing browser', error);
		}
	}

	/**
	 * Safely execute an operation with the browser
	 */
	async execute<T>(
		operation: (page: Page) => Promise<T>,
		description: string = 'Operation',
	): Promise<T | null> {
		try {
			const page = await this.getPage();
			return await operation(page);
		} catch (error) {
			logger.debug(
				`${description} failed: ${error instanceof Error ? error.message : String(error)}`,
			);
			return null;
		}
	}

	/**
	 * Check if browser is initialized
	 */
	isInitialized(): boolean {
		return this.initialized && this.browser !== null;
	}
}

// Export singleton instance
export const browserPool = new BrowserPool();

/**
 * Convenience function for cleanup on script exit
 */
export async function closeBrowserOnExit(pool: BrowserPool = browserPool): Promise<void> {
	process.on('SIGINT', async () => {
		logger.warning('Received SIGINT, closing browser...');
		await pool.close();
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		logger.warning('Received SIGTERM, closing browser...');
		await pool.close();
		process.exit(0);
	});
}

export default browserPool;
