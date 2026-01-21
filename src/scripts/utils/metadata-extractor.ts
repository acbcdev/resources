import { type Page } from 'playwright';
import * as cheerio from 'cheerio';
import type { OGMetadata } from '../types';

/**
 * Metadata extractor for Open Graph data
 * Provides methods to extract OG metadata from HTML or Playwright pages
 * Uses singleton pattern for consistent extraction logic
 */
export class MetadataExtractor {
	/**
	 * Extract OG metadata from raw HTML using Cheerio
	 */
	async extractFromHTML(html: string, url: string): Promise<OGMetadata> {
		const $ = cheerio.load(html);
		const metadata: OGMetadata = {};

		// Extract OG meta tags
		$('meta[property^="og:"], meta[name]').each((_, el) => {
			const $el = $(el);
			const property = $el.attr('property') || $el.attr('name') || '';
			const content = $el.attr('content');

			if (!content) return;

			if (property === 'og:title') metadata.title = content;
			else if (property === 'og:url') metadata.url = content;
			else if (property === 'og:image') metadata.image = content;
			else if (property === 'og:description') metadata.description = content;
			else if (property === 'og:type') metadata.type = content;
			else if (property === 'og:site_name') metadata.site_name = content;
			else if (property === 'og:video') metadata.video = content;
		});

		// Fallback to title tag
		if (!metadata.title) {
			metadata.title = $('title').text() || undefined;
		}

		// Fallback to meta description
		if (!metadata.description) {
			const metaDesc = $('meta[name="description"]');
			if (metaDesc) {
				metadata.description = metaDesc.attr('content') || undefined;
			}
		}

		// Extract favicon
		const favicon =
			$('link[rel="icon"]').attr('href') ||
			$('link[rel="shortcut icon"]').attr('href') ||
			'/favicon.ico';

		if (favicon) {
			// Resolve relative URLs
			try {
				const faviconUrl = new URL(favicon, url).href;
				metadata.icon = faviconUrl;
			} catch {
				// If URL parsing fails, use favicon as-is
				metadata.icon = favicon;
			}
		}

		return metadata;
	}

	/**
	 * Extract OG metadata from a Playwright page
	 */
	async extractFromPage(page: Page): Promise<OGMetadata> {
		return page.evaluate(() => {
			const metadata: OGMetadata = {};

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
}

// Export singleton instance
export const metadataExtractor = new MetadataExtractor();

export default metadataExtractor;
