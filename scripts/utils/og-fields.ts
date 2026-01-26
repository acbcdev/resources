/**
 * Open Graph field names as a constant
 * Used across extraction, enrichment, and logging
 */
export const OG_FIELDS = [
	'url',
	'title',
	'description',
	'image',
	'icon',
	'type',
	'site_name',
	'video',
] as const;

export type OGField = (typeof OG_FIELDS)[number];
