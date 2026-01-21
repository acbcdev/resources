#!/usr/bin/env bun
/**
 * Step 2: AI Metadata Enrichment
 *
 * Input: ogData.json (from step 1)
 * Output: aiEnriched.json (with AI-generated metadata)
 * Backup: backupAI.json (incremental saves for resume)
 *
 * This script:
 * - Loads OG data from step 1
 * - Fetches website content with Cheerio
 * - Uses AI (Google/Mistral/Groq) to generate structured metadata
 * - Merges AI data with OG data
 * - Saves incrementally for resume capability
 */

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import { SCRIPTS_CONFIG, getRandomAIModel, getModelName, validateConfig } from './config';
import { logger, fileIO, withRetry, batchExecuteWithRetry, setupGracefulShutdown, updateShutdownStats, httpFetcher } from './utils';
import type { ResourceWithOG, ResourceWithAI } from './types';

/**
 * Schema for AI-generated metadata
 */
const AIGeneratedSchema = z.object({
	name: z.string().describe('The name/title of the resource'),
	description: z.string().describe('A brief description of what the resource does'),
	category: z
		.array(z.string())
		.describe('Array of relevant categories'),
	topic: z.string().optional().describe('Secondary topic or subject'),
	main_features: z
		.array(
			z.object({
				feature: z.string(),
				description: z.string(),
			}),
		)
		.optional()
		.describe('3-5 main features of the resource'),
	tags: z.array(z.string()).optional().describe('5-10 relevant tags'),
	targetAudience: z.array(z.string()).optional().describe('Who this resource is for'),
	pricing: z.enum(['Free', 'Paid', 'Freemium', 'Opensource', 'Premium']).optional().describe('Pricing model'),
});

/**
 * Get AI model instance
 */
function getAIModel() {
	const modelKey = getRandomAIModel();

	switch (modelKey) {
		case 'google':
			return google(getModelName('google'));
		case 'mistral':
			return mistral(getModelName('mistral'));
		case 'groq':
			return groq(getModelName('groq'));
		default:
			return google(getModelName('google'));
	}
}

/**
 * Generate AI metadata for a resource
 */
async function generateAIMetadata(
	resource: ResourceWithOG,
): Promise<z.infer<typeof AIGeneratedSchema>> {
	return withRetry(
		async () => {
			// Fetch website content
			const content = await httpFetcher.fetchTextContent(
				resource.url,
				SCRIPTS_CONFIG.ai.maxContentLength,
				SCRIPTS_CONFIG.network.fetchTimeout,
			);

			if (!content || content.length < 50) {
				throw new Error('Not enough content to analyze');
			}

			// Get random AI model
			const model = getAIModel();
			const modelKey = getRandomAIModel();

			logger.debug(`Using ${modelKey} for ${resource.url}`);

			// Generate metadata with AI
			const result = await generateObject({
				model,
				schema: AIGeneratedSchema,
				prompt: `Analyze this website content and extract structured metadata.

Website URL: ${resource.url}
OG Title: ${resource.og.title || 'N/A'}
OG Description: ${resource.og.description || 'N/A'}

Website Content:
${content}

Extract the following information:
- name: The actual name/title of the resource
- description: A brief 1-2 sentence description
- category: Array of 1-3 relevant categories (e.g., Tools, Libraries, Frameworks, Design, etc.)
- topic: Secondary subject/topic if applicable
- main_features: 3-5 key features/capabilities
- tags: 5-10 relevant tags/keywords
- targetAudience: Who should use this (e.g., Developers, Designers, etc.)
- pricing: Free, Paid, Freemium, Opensource, or Premium

Be accurate and concise.`,
				temperature: SCRIPTS_CONFIG.ai.temperature,
				// maxTokens: SCRIPTS_CONFIG.ai.maxTokens,
			});

			return result.object;
		},
		`Generate AI metadata for ${resource.url}`,
		{ maxAttempts: 2 },
	);
}

/**
 * Enrich a single resource with AI metadata
 */
async function enrichResourceWithAI(resource: ResourceWithOG): Promise<ResourceWithAI> {
	try {
		const aiData = await generateAIMetadata(resource);

		// Log success with extracted fields
		const fieldsFound: string[] = [];
		if (aiData.name) fieldsFound.push('name');
		if (aiData.description) fieldsFound.push('description');
		if (aiData.category) fieldsFound.push('category');
		if (aiData.main_features) fieldsFound.push('main_features');
		if (aiData.tags) fieldsFound.push('tags');
		if (aiData.topic) fieldsFound.push('topic');
		if (aiData.targetAudience) fieldsFound.push('targetAudience');
		if (aiData.pricing) fieldsFound.push('pricing');

		// Use the network logger for consistency
		logger.networkSuccess(resource.url, 'fetch', fieldsFound, 200);

		return {
			...resource,
			...aiData,
			enriched_at: new Date().toISOString(),
		} as ResourceWithAI;
	} catch (error) {
		logger.error(
			`Failed to enrich ${resource.url}`,
			error,
		);

		// Return resource with minimal data if AI fails
		return {
			...resource,
			name: resource.og.title || resource.url,
			description: resource.og.description || 'Resource',
			category: ['Tools'], // Default category as array
			enriched_at: new Date().toISOString(),
		} as ResourceWithAI;
	}
}

/**
 * Main function
 */
async function main() {
	// Setup graceful shutdown handler
	setupGracefulShutdown();

	logger.section('AI Metadata Enrichment');

	try {
		// Validate configuration
		logger.info('Validating configuration...');
		validateConfig();
		// Ensure parent directory exists for output files
		await fileIO.ensureParentDir(SCRIPTS_CONFIG.paths.output.aiEnriched);

		// Load OG data from step 1
		logger.info('Loading OG data from step 1...');
		const ogData = await fileIO.readJSONArray<ResourceWithOG>(SCRIPTS_CONFIG.paths.output.ogData);

		if (ogData.length === 0) {
			logger.error('No OG data found. Please run 1-extract-og.ts first.');
			process.exit(1);
		}

		logger.success(`Loaded ${ogData.length} resources`);

		// Load existing enriched data to skip processed resources
		logger.info('Loading existing enriched data...');
		const existingEnriched = await fileIO.readJSONArray<ResourceWithAI>(
			SCRIPTS_CONFIG.paths.output.aiEnriched,
		);
		const enrichedUrls = new Set(existingEnriched.map((r) => r.url));

		// Filter to un-enriched resources
		const resourcesToEnrich = ogData.filter((r) => !enrichedUrls.has(r.url));
		logger.info(
			`${resourcesToEnrich.length} resources to enrich (${enrichedUrls.size} already done)`,
		);

		if (resourcesToEnrich.length === 0) {
			logger.success('All resources already enriched!');
			return;
		}

		// Process with retry and error handling
		logger.section('Enriching Resources');
		let processedCount = 0;
		let successCount = 0;
		const results = await batchExecuteWithRetry(
			resourcesToEnrich,
			async (resource) => {
				const enriched = await enrichResourceWithAI(resource);
				// Save incrementally
				await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.backupAI, enriched);
				return enriched;
			},
			{
				maxAttempts: 2,
				onProgress: (current, total) => {
					logger.progress(current, total, 'Enriching');
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

		// Combine existing with new enriched data
		const allEnriched = [...existingEnriched, ...results.successful];

		// Save final output
		logger.section('Saving Results');
		await fileIO.writeJSON(SCRIPTS_CONFIG.paths.output.aiEnriched, allEnriched);

		// Log results
		logger.section('Summary');
		logger.table({
			'Total resources': ogData.length,
			'Successfully enriched': results.successful.length,
			'Failed (using defaults)': results.failed.length,
			'Already enriched': enrichedUrls.size,
		});

		if (results.failed.length > 0) {
			logger.warning(`${results.failed.length} resources used default values:`);
			for (const { item } of results.failed.slice(0, 5)) {
				logger.warning(`  - ${item.url}`);
			}
			if (results.failed.length > 5) {
				logger.warning(`  ... and ${results.failed.length - 5} more`);
			}

		// Save failed resources to file for tracking
		const failedResources = results.failed.map((item) => ({
			url: item.item.url,
			error: 'Failed to enrich - used default values',
			timestamp: new Date().toISOString(),
		}));
		await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.failedAI, ...failedResources);
		logger.info(`Failed resources saved to: ${SCRIPTS_CONFIG.paths.output.failedAI}`);
		}

		// Show file info
		const fileInfo = await fileIO.getFileInfo(SCRIPTS_CONFIG.paths.output.aiEnriched);
		if (fileInfo) {
			logger.success(
				`Output saved: ${SCRIPTS_CONFIG.paths.output.aiEnriched} (${fileInfo.sizeFormatted})`,
			);
		}

		logger.success('✓ Step 2 complete! Output: aiEnriched.json');
		logger.info('Next step: Run 3-capture-screenshots.ts to add images');
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
