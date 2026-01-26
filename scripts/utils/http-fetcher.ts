import * as cheerio from 'cheerio';
import { SCRIPTS_CONFIG } from '../config';
import { logger } from './logger';

/**
 * HTTP fetcher utility for fetching and parsing web content
 * Provides methods for raw HTML fetching and text extraction
 * Uses singleton pattern for consistent configuration
 */
export class HTTPFetcher {
	/**
	 * Helper: Wrap a fetch call with timeout handling
	 */
	private async withTimeout<T>(
		fn: (signal: AbortSignal) => Promise<T>,
		timeoutMs: number,
	): Promise<T> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			return await fn(controller.signal);
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Fetch raw HTML content from a URL with timeout handling
	 */
	async fetchHTML(url: string, timeoutMs: number = SCRIPTS_CONFIG.network.fetchTimeout): Promise<string> {
		return this.withTimeout(async (signal) => {
			const response = await fetch(url, {
				headers: {
					'User-Agent': SCRIPTS_CONFIG.network.userAgent,
				},
				signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			return response.text();
		}, timeoutMs);
	}

	/**
	 * Fetch HTML and extract text content using Cheerio
	 * Removes scripts, styles, and excessive whitespace
	 * Returns text content limited to maxLength characters
	 */
	async fetchTextContent(
		url: string,
		maxLength: number = SCRIPTS_CONFIG.ai.maxContentLength,
		timeoutMs: number = SCRIPTS_CONFIG.network.fetchTimeout,
	): Promise<string> {
		return this.withTimeout(async (signal) => {
			const response = await fetch(url, {
				headers: {
					'User-Agent': SCRIPTS_CONFIG.network.userAgent,
				},
				signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const html = await response.text();

			// Parse HTML and extract text
			const $ = cheerio.load(html);

			// Remove script and style elements
			$('script, style, noscript').remove();

			// Get text content
			const rawText = $('body').text() || $('html').text() || '';

			// Clean up whitespace
			const text = rawText.replace(/\s+/g, ' ').trim().substring(0, maxLength);

			const fieldsFound = ['content'];
			logger.networkSuccess(url, 'fetch', fieldsFound, response.status);
			return text;
		}, timeoutMs).catch((error) => {
			const statusCode =
				error instanceof Error && error.message.includes('HTTP')
					? parseInt(error.message.replace('HTTP ', ''))
					: undefined;
			const fieldsAttempted = ['content'];
			logger.networkError(url, 'fetch', error, statusCode, fieldsAttempted);
			throw error;
		});
	}
}

// Export singleton instance
export const httpFetcher = new HTTPFetcher();

export default httpFetcher;
