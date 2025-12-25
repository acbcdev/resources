/**
 * Sidebar category groupings for main navigation
 * Groups the 51 categories into 10 organized sections
 */

export const CATEGORY_GROUPS = {
	AI: ['AI', 'Agents', 'LLMs', 'Video & Image', 'Audio', 'Code', 'Machine Learning', 'Prompts'],
	Design: [
		'Design',
		'Colors',
		'Fonts',
		'Icons',
		'Illustrations',
		'Backgrounds',
		'Inspirations',
		'Photos',
		'Videos',
		'3D',
	],
	Libraries: ['Libraries', 'Components', 'Frameworks'],
	Services: ['API', 'Hosting', 'Database', 'Storage', 'Authentication', 'CMS'],
	Learning: [
		'Learning Resources',
		'Course',
		'Challenges',
		'Blogs',
		'Reading',
		'Documentation',
	],
	Tools: [
		'Tools',
		'Testing',
		'Performance',
		'Productivity',
		'Forms',
		'Charts',
		'Animation',
		'Accessibility',
		'Extensions',
	],
	Marketing: ['Newsletter', 'Analytics', 'SEO', 'Email'],
	Startups: ['Domain', 'Security', 'Legal', 'Funding', 'Business Tools'],
	Ecommerce: ['Payments', 'Shipping', 'Checkout', 'Inventory'],
	Others: ['Games', 'Websites', 'Other'],
} as const;

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;
