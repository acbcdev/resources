import { slugify } from "@/lib/utils";
import { collectionNames } from "@/consts/collections";
import { z } from "zod";
import {
	Bot,
	Link,
	BarChart,
	Edit,
	Image,
	Palette,
	Box,
	Brush,
	Hash,
	Image as IllustrationIcon,
	Lightbulb,
	Camera,
	Video,
	Type,
	BookOpen,
	PocketKnife,
	Globe,
	GraduationCap,
	Gamepad,
	Lock,
	Accessibility,
	Film,
	Key,
	FileText,
	Trophy,
	LineChart,
	Book,
	Database,
	File,
	Globe2,
	Blocks,
	Clipboard,
	Layers,
	Server,
	Mail,
	Zap,
	Clock,
	Book as ReadingIcon,
	HardDrive,
	FlaskConical,
	Boxes,
	HelpCircle,
} from "lucide-react";

export type Category = typeof CATEGORIES;

export const FeatureSchema = z.object({
	feature: z.string(),
	description: z.string(),
});
// añadele un comentarios para explicar que tipo de recurso o herramienta debe ser utilizado

export const CATEGORIES = [
	{ name: "AI", icon: Bot }, // Tools related to artificial intelligence
	{ name: "API", icon: Link }, // Tools related to APIs, including mock APIs and API directories
	{ name: "Analytics", icon: BarChart }, // Analytics tools and platforms for data insights
	{ name: "Blogs", icon: Edit }, // Websites that primarily publish articles or blogs
	{ name: "Backgrounds", icon: Image }, // Tools for backgrounds, e.g., BGjar, SVG Backgrounds
	{ name: "Colors", icon: Palette }, // Tools for colors, e.g., ColorMagic, UI Colors
	{ name: "Components", icon: Box }, // UI component libraries and frameworks
	{ name: "Design", icon: Brush }, // Design-related tools, e.g., Shapefest
	{ name: "Icons", icon: Hash }, // Tools for icons, e.g., Feather Icons, YesIcon
	{ name: "Illustrations", icon: IllustrationIcon }, // Tools for illustrations, e.g., unDraw, SVG Doodles
	{ name: "Inspirations", icon: Lightbulb }, // Sites for design inspiration, e.g., Designspiration
	{ name: "Photos", icon: Camera }, // Tools for photos, e.g., Pexels, Unsplash
	{ name: "Videos", icon: Video }, // Tools for videos, e.g., Pexels
	{ name: "Fonts", icon: Type }, // Tools for fonts, e.g., BeFonts, FontPair
	{ name: "Libraries", icon: BookOpen }, // UI frameworks and component libraries
	{ name: "Tools", icon: PocketKnife }, // Utility tools not fitting into other categories
	{ name: "Websites", icon: Globe }, // Websites that don't fit into any other category
	{ name: "Learning Resources", icon: GraduationCap }, // Resources for learning and education
	{ name: "Games", icon: Gamepad }, // Tools related to game development
	{ name: "Security", icon: Lock }, // Tools for security research, etc.
	{ name: "Accessibility", icon: Accessibility }, // Tools for web accessibility
	{ name: "Animation", icon: Film }, // Animation tools and libraries
	{ name: "Authentication", icon: Key }, // Authentication tools and platforms
	{ name: "CMS", icon: FileText }, // Content management systems
	{ name: "Challenges", icon: Trophy }, // Web design and development challenges
	{ name: "Charts", icon: LineChart }, // Tools for creating charts and data visualizations
	{ name: "Course", icon: Book }, // Platforms for free or paid courses
	{ name: "Database", icon: Database }, // Tools for database management
	{ name: "Documentation", icon: File }, // Tools for documentation in web development
	{ name: "Domain", icon: Globe2 }, // Domain tools
	{ name: "Extensions", icon: Blocks }, // Tools for gnome or browser extensions
	{ name: "Forms", icon: Clipboard }, // Tools for creating forms
	{ name: "Frameworks", icon: Layers }, // Frameworks for various programming technologies
	{ name: "Hosting", icon: Server }, // Tools for hosting, e.g., Vercel
	{ name: "Newsletter", icon: Mail }, // Newsletter tools and platforms
	{ name: "Performance", icon: Zap }, // Tools for performance optimization
	{ name: "Productivity", icon: Clock }, // Personal productivity tools
	{ name: "Reading", icon: ReadingIcon }, // Tools for reading books
	{ name: "Storage", icon: HardDrive }, // Tools for storage, e.g., Turso or cloud storage
	{ name: "Testing", icon: FlaskConical }, // Tools for testing, e.g., Playwright
	{ name: "3D", icon: Boxes }, // Tools for 3D or 3D-like SVGs, e.g., Spline, Atropos
	{ name: "Other", icon: HelpCircle }, // For tools that don't fit into any other category
] as const;

const categoriesNames = CATEGORIES.map(({ name }) => name);
export const CategorySchema = z.enum(categoriesNames as [string, ...string[]]);

export const TARGETAUDIENCE = [
	'Beginner developers', 'Designers', 'Developers', 'Content Creators', 'Educators', 'All', 'Artists', 'Scientists', "Students", "Security Researchers"
] as const;
export const TargetAudienceSchema = z.enum(TARGETAUDIENCE);

export const OgSchema = z.object({
	title: z.string().optional(),
	url: z.string().url().optional(),
	image: z.string().url().optional(),
	type: z.string().optional(),
	site_name: z.string().optional(),
	description: z.string().optional(),
	icon: z.string().optional(),
	video: z.string().optional(),
});

const colletions = collectionNames;

const collectionsSchema = z.enum(colletions);
export const ToolSchema = z.object({
	name: z.string(),
	description: z.string(),
	image: z.string().url().optional(),
	category: z.union([CategorySchema, z.array(CategorySchema)]),
	url: z.string().url(),
	topic: z.string(),
	main_features: z.array(FeatureSchema).optional(),
	tags: z
		.array(z.string())
		.transform((tags) => tags.map((tag) => slugify(tag))),
	targetAudience: z
		.union([TargetAudienceSchema, z.array(TargetAudienceSchema)])
		.optional(),
	pricing: z.enum(['Free', 'Freemium', 'Paid', "Premium", 'Opensource']).optional(),
	alternatives: z.array(z.string()).optional(),
	og: OgSchema.optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	collections: z
		.union([collectionsSchema, z.array(collectionsSchema)])
		.optional(),
});

export type Tool = z.infer<typeof ToolSchema>;
