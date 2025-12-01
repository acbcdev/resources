/**
 * Sidebar category groupings for main navigation
 * Groups the 42 categories into 7 organized sections
 */

export const CATEGORY_GROUPS = {
	AI: ['AI', 'Analytics'],
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
	],
	Others: ['Games', '3D', 'Security', 'Domain', 'Extensions', 'Newsletter', 'Other'],
} as const;

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;
