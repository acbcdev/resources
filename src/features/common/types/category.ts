import { z } from 'zod';
import type { ComponentType, SVGProps } from 'react';
import {
	IconBrandOpenai,
	IconBrain,
	IconSparkles,
	IconPhoto,
	IconMicrophone,
	IconCode,
	IconChartLine,
	IconMessage,
	IconPalette,
	IconTypography,
	IconIcons,
	IconBrush,
	IconBackground,
	IconBulb,
	IconVideo,
	IconCube,
	IconBooks,
	IconLayout,
	IconPackage,
	IconServer,
	IconApi,
	IconCloud,
	IconDatabase,
	IconArchive,
	IconLock,
	IconFileText,
	IconSchool,
	IconBook,

	IconTarget,
	IconRss,
	IconArticle,
	IconNotebook,
	IconHammer,
	IconTestPipe,
	IconBolt,
	IconClock,
	IconCheckbox,
	IconChartBar,
	IconWand,
	IconAccessible,
	IconPuzzle,
	IconTrendingUp,
	IconNews,
	IconChartPie,
	IconSearch,
	IconMail,
	IconBriefcase,
	IconWorld,
	IconShield,
	IconScale,
	IconCoin,
	IconCalculator,
	IconShoppingCart,
	IconCreditCard,
	IconTruck,
	IconReceipt,
	IconBox,
	IconDots,
	IconDeviceGamepad2,
} from '@tabler/icons-react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type Subcategory = {
	name: string;
	icon: IconComponent;
};

type CategoryItem = {
	name: string;
	icon: IconComponent;
	subcategories?: Subcategory[];
};

export const CATEGORIES: CategoryItem[] = [
	{
		name: 'AI',
		icon: IconSparkles,
		subcategories: [
			{ name: 'Agents', icon: IconBrain },
			{ name: 'LLMs', icon: IconSparkles },
			{ name: 'Video & Image', icon: IconPhoto },
			{ name: 'Audio', icon: IconMicrophone },
			{ name: 'Code', icon: IconCode },
			{ name: 'Machine Learning', icon: IconChartLine },
			{ name: 'Prompts', icon: IconMessage },
		],
	},
	{
		name: 'Design',
		icon: IconPalette,
		subcategories: [
			{ name: 'Colors', icon: IconPalette },
			{ name: 'Fonts', icon: IconTypography },
			{ name: 'Icons', icon: IconIcons },
			{ name: 'Illustrations', icon: IconBrush },
			{ name: 'Backgrounds', icon: IconBackground },
			{ name: 'Inspirations', icon: IconBulb },
			{ name: 'Photos', icon: IconPhoto },
			{ name: 'Videos', icon: IconVideo },
			{ name: '3D', icon: IconCube },
		],
	},
	{
		name: 'Libraries',
		icon: IconBooks,
		subcategories: [
			{ name: 'Components', icon: IconLayout },
			{ name: 'Frameworks', icon: IconPackage },
		],
	},
	{
		name: 'Services',
		icon: IconServer,
		subcategories: [
			{ name: 'API', icon: IconApi },
			{ name: 'Hosting', icon: IconCloud },
			{ name: 'Database', icon: IconDatabase },
			{ name: 'Storage', icon: IconArchive },
			{ name: 'Authentication', icon: IconLock },
			{ name: 'CMS', icon: IconFileText },
		],
	},
	{
		name: 'Learning',
		icon: IconSchool,
		subcategories: [
			{ name: 'Learning Resources', icon: IconBook },
			{ name: 'Course', icon: IconSchool },
			{ name: 'Challenges', icon: IconTarget },
			{ name: 'Blogs', icon: IconRss },
			{ name: 'Reading', icon: IconArticle },
			{ name: 'Documentation', icon: IconNotebook },
		],
	},
	{
		name: 'Tools',
		icon: IconHammer,
		subcategories: [
			{ name: 'Testing', icon: IconTestPipe },
			{ name: 'Performance', icon: IconBolt },
			{ name: 'Productivity', icon: IconClock },
			{ name: 'Forms', icon: IconCheckbox },
			{ name: 'Charts', icon: IconChartBar },
			{ name: 'Animation', icon: IconWand },
			{ name: 'Accessibility', icon: IconAccessible },
			{ name: 'Extensions', icon: IconPuzzle },
		],
	},
	{
		name: 'Marketing',
		icon: IconTrendingUp,
		subcategories: [
			{ name: 'Newsletter', icon: IconNews },
			{ name: 'Analytics', icon: IconChartPie },
			{ name: 'SEO', icon: IconSearch },
			{ name: 'Email', icon: IconMail },
		],
	},
	{
		name: 'Startups',
		icon: IconBriefcase,
		subcategories: [
			{ name: 'Domain', icon: IconWorld },
			{ name: 'Security', icon: IconShield },
			{ name: 'Legal', icon: IconScale },
			{ name: 'Funding', icon: IconCoin },
			{ name: 'Business Tools', icon: IconCalculator },
		],
	},
	{
		name: 'Ecommerce',
		icon: IconShoppingCart,
		subcategories: [
			{ name: 'Payments', icon: IconCreditCard },
			{ name: 'Shipping', icon: IconTruck },
			{ name: 'Checkout', icon: IconReceipt },
			{ name: 'Inventory', icon: IconBox },
		],
	},
	{
		name: 'Others',
		icon: IconDots,
		subcategories: [
			{ name: 'Games', icon: IconDeviceGamepad2 },
			{ name: 'Websites', icon: IconWorld },
			{ name: 'Other', icon: IconDots },
		],
	},
];

export type Category = (typeof CATEGORIES)[number];

export const getAllCategoryNames = (): string[] => {
	return CATEGORIES.flatMap((cat) =>
		cat.subcategories ? [cat.name, ...cat.subcategories.map((s) => s.name)] : [cat.name]
	);
};

const categoryNames = getAllCategoryNames();
export const CategorySchema = z.enum(categoryNames as [string, ...string[]]);
export type CategoryName = z.infer<typeof CategorySchema>;
