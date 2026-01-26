#!/usr/bin/env bun
/**
 * Step 2: AI Metadata Enrichment (Simplified)
 *
 * Input: ogData.json (from step 1)
 * Output: aiEnriched.json (with AI-generated metadata)
 * Failed: failedAI.json (resources that failed enrichment)
 *
 * This script:
 * - Loads OG data from step 1
 * - Fetches website content
 * - Uses Google AI to generate structured metadata
 * - Merges AI data with OG data
 * - Skips failed resources and saves them for retry on next run
 */

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { SCRIPTS_CONFIG, getModelName, validateConfig } from './config';
import { logger, fileIO, setupGracefulShutdown, httpFetcher } from './utils';
import type { ResourceWithOG, ResourceWithAI } from './types';
import { FeatureSchema, PricingSchema } from '@/features/common/types/resource';
import { TargetAudienceSchema } from '@/features/common/types/audience';
import { CategorySchema } from '@/features/common/types/category';

/**
 * AI metadata field names to check for in enrichment results
 */
const AI_FIELDS = [
	'name',
	'description',
	'category',
	'main_features',
	'tags',
	'topic',
	'targetAudience',
	'pricing',
] as const;

/**
 * Schema for AI-generated metadata
 * Aligned with ToolSchema from @/features/common/types/resource.ts
 */
const AIGeneratedSchema = z.object({
	name: z.string().min(1).describe('The name/title of the resource'),
	description: z.string().min(1).describe('A brief description of what the resource does'),
	category: z.array(CategorySchema).describe('Array of 1-3 relevant categories'),
	topic: z.string().min(1).describe('Secondary topic or subject'),
	main_features: z
		.array(FeatureSchema)
		.optional()
		.describe('3-5 main features/capabilities with feature name and description'),
	tags: z
		.array(z.string())
		.optional()
		.describe('5-10 relevant tags (plain text, will be slugified)'),
	targetAudience: z
		.array(TargetAudienceSchema)
		.optional()
		.describe('Who should use this resource (strict enum values)'),
	pricing: PricingSchema.optional().describe('Pricing model'),
});

/**
 * Generate AI metadata for a resource
 */
async function generateAIMetadata(
	resource: ResourceWithOG,
): Promise<z.infer<typeof AIGeneratedSchema>> {
	// Fetch website content
	const content = await httpFetcher.fetchTextContent(
		resource.url,
		SCRIPTS_CONFIG.ai.maxContentLength,
		SCRIPTS_CONFIG.network.fetchTimeout,
	);

	if (!content || content.length < 50) {
		throw new Error('Not enough content to analyze');
	}

	// Use Google AI model directly
	const model = google('gemini-3-flash-preview');

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
- topic: Secondary subject/topic (required)
- main_features: 3-5 key features/capabilities with feature name and description
- tags: 5-10 relevant tags/keywords (plain text, will be auto-slugified)
- targetAudience: Who should use this (strict values: Developers, Designers, Marketers, Founders, etc.)
- pricing: Free, Paid, Freemium, Opensource, or Premium (optional)

Be accurate and concise.`,
		temperature: SCRIPTS_CONFIG.ai.temperature,
		// maxTokens: SCRIPTS_CONFIG.ai.maxTokens,
	});

	return result.object;
}

/**
 * Helper: Check which AI fields were found
 */
function getFoundAIFields(data: z.infer<typeof AIGeneratedSchema>): string[] {
	return AI_FIELDS.filter((field) => data[field as keyof typeof data]);
}

/**
 * Enrich a single resource with AI metadata
 * Throws error on failure (no fallback to defaults)
 */
async function enrichResourceWithAI(resource: ResourceWithOG): Promise<ResourceWithAI> {
	const aiData = await generateAIMetadata(resource);

	// Log success with extracted fields
	const fieldsFound = getFoundAIFields(aiData);
	logger.networkSuccess(resource.url, 'fetch', fieldsFound, 200);

	return {
		...resource,
		...aiData,
		enriched_at: new Date().toISOString(),
	} as ResourceWithAI;
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

		// Process with simple sequential loop
		logger.section('Enriching Resources');
		const successful: ResourceWithAI[] = [];
		const failed: Array<{ url: string; error: string; timestamp: string }> = [];

		for (let i = 0; i < resourcesToEnrich.length; i++) {
			const resource = resourcesToEnrich[i];
			logger.info(`Processing ${i + 1}/${resourcesToEnrich.length}: ${resource.url}`);

			try {
				const enriched = await enrichResourceWithAI(resource);
				successful.push(enriched);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				logger.error(`Failed to enrich ${resource.url}: ${errorMsg}`);
				failed.push({
					url: resource.url,
					error: errorMsg,
					timestamp: new Date().toISOString(),
				});
			}
		}

		// Combine existing with new enriched data
		const allEnriched = [...existingEnriched, ...successful];

		// Save final output
		logger.section('Saving Results');
		await fileIO.writeJSON(SCRIPTS_CONFIG.paths.output.aiEnriched, allEnriched);

		// Save failed resources for retry on next run
		if (failed.length > 0) {
			await fileIO.appendToJSONArray(SCRIPTS_CONFIG.paths.output.failedAI, failed);
			logger.info(
				`Saved ${failed.length} failed resources to: ${SCRIPTS_CONFIG.paths.output.failedAI}`,
			);
		}

		// Log results
		logger.section('Summary');
		logger.table({
			'Total resources': ogData.length,
			'Successfully enriched': successful.length,
			'Failed to enrich': failed.length,
			'Already enriched': enrichedUrls.size,
		});

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
