import {
	Accessibility,
	Banknote,
	BarChart,
	Blocks,
	Book,
	BookOpen,
	Bot,
	Box,
	Boxes,
	Briefcase,
	Brush,
	Camera,
	Clipboard,
	Clock,
	CreditCard,
	Database,
	Edit,
	File,
	FileText,
	Film,
	FlaskConical,
	Gamepad,
	Globe,
	Globe2,
	GraduationCap,
	HardDrive,
	Hash,
	HelpCircle,
	Image as IllustrationIcon,
	Image,
	Key,
	Layers,
	Lightbulb,
	LineChart,
	Link,
	Lock,
	Mail,
	Package,
	Palette,
	PocketKnife,
	Book as ReadingIcon,
	Scale,
	Search,
	Server,
	ShoppingCart,
	Trophy,
	Truck,
	Type,
	Video,
	Zap,
} from 'lucide-react';
import { z } from 'zod';

export const CATEGORIES = [
	{ name: 'AI', icon: Bot }, // Tools related to artificial intelligence
	{ name: 'API', icon: Link }, // Tools related to APIs, including mock APIs and API directories
	{ name: 'Analytics', icon: BarChart }, // Analytics tools and platforms for data insights
	{ name: 'Blogs', icon: Edit }, // Websites that primarily publish articles or blogs
	{ name: 'Backgrounds', icon: Image }, // Tools for backgrounds, e.g., BGjar, SVG Backgrounds
	{ name: 'Colors', icon: Palette }, // Tools for colors, e.g., ColorMagic, UI Colors
	{ name: 'Components', icon: Box }, // UI component libraries and frameworks
	{ name: 'Design', icon: Brush }, // Design-related tools, e.g., Shapefest
	{ name: 'Icons', icon: Hash }, // Tools for icons, e.g., Feather Icons, YesIcon
	{ name: 'Illustrations', icon: IllustrationIcon }, // Tools for illustrations, e.g., unDraw, SVG Doodles
	{ name: 'Inspirations', icon: Lightbulb }, // Sites for design inspiration, e.g., Designspiration
	{ name: 'Photos', icon: Camera }, // Tools for photos, e.g., Pexels, Unsplash
	{ name: 'Videos', icon: Video }, // Tools for videos, e.g., Pexels
	{ name: 'Fonts', icon: Type }, // Tools for fonts, e.g., BeFonts, FontPair
	{ name: 'Libraries', icon: BookOpen }, // UI frameworks and component libraries
	{ name: 'Tools', icon: PocketKnife }, // Utility tools not fitting into other categories
	{ name: 'Websites', icon: Globe }, // Websites that don't fit into any other category
	{ name: 'Learning Resources', icon: GraduationCap }, // Resources for learning and education
	{ name: 'Games', icon: Gamepad }, // Tools related to game development
	{ name: 'Security', icon: Lock }, // Tools for security research, etc.
	{ name: 'Accessibility', icon: Accessibility }, // Tools for web accessibility
	{ name: 'Animation', icon: Film }, // Animation tools and libraries
	{ name: 'Authentication', icon: Key }, // Authentication tools and platforms
	{ name: 'CMS', icon: FileText }, // Content management systems
	{ name: 'Challenges', icon: Trophy }, // Web design and development challenges
	{ name: 'Charts', icon: LineChart }, // Tools for creating charts and data visualizations
	{ name: 'Course', icon: Book }, // Platforms for free or paid courses
	{ name: 'Database', icon: Database }, // Tools for database management
	{ name: 'Documentation', icon: File }, // Tools for documentation in web development
	{ name: 'Domain', icon: Globe2 }, // Domain tools
	{ name: 'Extensions', icon: Blocks }, // Tools for gnome or browser extensions
	{ name: 'Forms', icon: Clipboard }, // Tools for creating forms
	{ name: 'Frameworks', icon: Layers }, // Frameworks for various programming technologies
	{ name: 'Hosting', icon: Server }, // Tools for hosting, e.g., Vercel
	{ name: 'Newsletter', icon: Mail }, // Newsletter tools and platforms
	{ name: 'Performance', icon: Zap }, // Tools for performance optimization
	{ name: 'Productivity', icon: Clock }, // Personal productivity tools
	{ name: 'Reading', icon: ReadingIcon }, // Tools for reading books
	{ name: 'Storage', icon: HardDrive }, // Tools for storage, e.g., Turso or cloud storage
	{ name: 'Testing', icon: FlaskConical }, // Tools for testing, e.g., Playwright
	{ name: '3D', icon: Boxes }, // Tools for 3D or 3D-like SVGs, e.g., Spline, Atropos
	{ name: 'Other', icon: HelpCircle }, // For tools that don't fit into any other category
	// Marketing categories
	{ name: 'SEO', icon: Search }, // Search engine optimization tools
	{ name: 'Email', icon: Mail }, // Email marketing, campaigns, automation
	// Startups categories
	{ name: 'Legal', icon: Scale }, // Legal/compliance tools for startups
	{ name: 'Funding', icon: Banknote }, // Investment, funding, pitch deck tools
	{ name: 'Business Tools', icon: Briefcase }, // General business productivity tools
	// E-commerce categories
	{ name: 'Payments', icon: CreditCard }, // Payment processing, invoicing, billing
	{ name: 'Shipping', icon: Truck }, // Shipping, logistics, fulfillment
	{ name: 'Checkout', icon: ShoppingCart }, // Cart and checkout tools
	{ name: 'Inventory', icon: Package }, // Inventory management tools
] as const;

export type Category = typeof CATEGORIES;

const categoriesNames = CATEGORIES.map(({ name }) => name);
export const CategorySchema = z.enum(categoriesNames as [string, ...string[]]);
