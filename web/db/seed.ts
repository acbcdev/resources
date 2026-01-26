import { Category, Collection, db, TargetAudience } from 'astro:db';
import { slugify } from '../src/features/common/lib/utils';

// ============================================================================
// Categories Data (from src/features/categories/types/category.ts)
// ============================================================================

const CATEGORIES_DATA = [
	{ name: 'AI', iconName: 'Bot' },
	{ name: 'API', iconName: 'Link' },
	{ name: 'Analytics', iconName: 'BarChart' },
	{ name: 'Blogs', iconName: 'Edit' },
	{ name: 'Backgrounds', iconName: 'Image' },
	{ name: 'Colors', iconName: 'Palette' },
	{ name: 'Components', iconName: 'Box' },
	{ name: 'Design', iconName: 'Brush' },
	{ name: 'Icons', iconName: 'Hash' },
	{ name: 'Illustrations', iconName: 'Image' },
	{ name: 'Inspirations', iconName: 'Lightbulb' },
	{ name: 'Photos', iconName: 'Camera' },
	{ name: 'Videos', iconName: 'Video' },
	{ name: 'Fonts', iconName: 'Type' },
	{ name: 'Libraries', iconName: 'BookOpen' },
	{ name: 'Tools', iconName: 'PocketKnife' },
	{ name: 'Websites', iconName: 'Globe' },
	{ name: 'Learning Resources', iconName: 'GraduationCap' },
	{ name: 'Games', iconName: 'Gamepad' },
	{ name: 'Security', iconName: 'Lock' },
	{ name: 'Accessibility', iconName: 'Accessibility' },
	{ name: 'Animation', iconName: 'Film' },
	{ name: 'Authentication', iconName: 'Key' },
	{ name: 'CMS', iconName: 'FileText' },
	{ name: 'Challenges', iconName: 'Trophy' },
	{ name: 'Charts', iconName: 'LineChart' },
	{ name: 'Course', iconName: 'Book' },
	{ name: 'Database', iconName: 'Database' },
	{ name: 'Documentation', iconName: 'File' },
	{ name: 'Domain', iconName: 'Globe2' },
	{ name: 'Extensions', iconName: 'Blocks' },
	{ name: 'Forms', iconName: 'Clipboard' },
	{ name: 'Frameworks', iconName: 'Layers' },
	{ name: 'Hosting', iconName: 'Server' },
	{ name: 'Newsletter', iconName: 'Mail' },
	{ name: 'Performance', iconName: 'Zap' },
	{ name: 'Productivity', iconName: 'Clock' },
	{ name: 'Reading', iconName: 'Book' },
	{ name: 'Storage', iconName: 'HardDrive' },
	{ name: 'Testing', iconName: 'FlaskConical' },
	{ name: '3D', iconName: 'Boxes' },
	{ name: 'Other', iconName: 'HelpCircle' },
	// Marketing categories
	{ name: 'SEO', iconName: 'Search' },
	{ name: 'Email', iconName: 'Mail' },
	// Startups categories
	{ name: 'Legal', iconName: 'Scale' },
	{ name: 'Funding', iconName: 'Banknote' },
	{ name: 'Business Tools', iconName: 'Briefcase' },
	// E-commerce categories
	{ name: 'Payments', iconName: 'CreditCard' },
	{ name: 'Shipping', iconName: 'Truck' },
	{ name: 'Checkout', iconName: 'ShoppingCart' },
	{ name: 'Inventory', iconName: 'Package' },
];

// ============================================================================
// Target Audiences Data (from src/features/audiences/types/audience.ts)
// ============================================================================

const TARGET_AUDIENCES_DATA = [
	'Beginner developers',
	'Designers',
	'Developers',
	'Content Creators',
	'Educators',
	'All',
	'Artists',
	'Scientists',
	'Students',
	'Security Researchers',
];

// ============================================================================
// Collections Data (from src/features/common/consts/collections.ts)
// ============================================================================

const COLLECTIONS_DATA = [
	{ name: 'Devs Beginner', description: '', image: '' },
	{ name: 'Desing', description: '', image: '' },
	{ name: 'Animations', description: '', image: '' },
	{ name: 'Design Tools', description: '', image: '' },
	{ name: 'Mockups', description: '', image: '' },
	{ name: 'A Good Blog', description: '', image: '' },
];

// ============================================================================
// Seed Function
// ============================================================================

export default async function seed() {
	// Seed Categories
	await db.insert(Category).values(
		CATEGORIES_DATA.map((cat, index) => ({
			id: index + 1,
			name: cat.name,
			slug: slugify(cat.name),
			iconName: cat.iconName,
		})),
	);

	// Seed Target Audiences
	await db.insert(TargetAudience).values(
		TARGET_AUDIENCES_DATA.map((name, index) => ({
			id: index + 1,
			name,
		})),
	);

	// Seed Collections
	await db.insert(Collection).values(
		COLLECTIONS_DATA.map((col, index) => ({
			id: index + 1,
			name: col.name,
			slug: slugify(col.name),
			description: col.description || null,
			image: col.image || null,
		})),
	);

	console.log('Seeded lookup tables:');
	console.log(`  - ${CATEGORIES_DATA.length} categories`);
	console.log(`  - ${TARGET_AUDIENCES_DATA.length} target audiences`);
	console.log(`  - ${COLLECTIONS_DATA.length} collections`);
}
