import { CATEGORIES, type Category } from 'web/src/features/common/types/category';
import type { Tool } from 'web/src/features/common/types/resource';
import { DATA } from 'web/src/data';

// Flatten CATEGORIES including subcategories for counting
const flattenCategories = () => {
	const flat: Array<{ name: string; icon: Category['icon'] }> = [];
	CATEGORIES.forEach((cat) => {
		flat.push({ name: cat.name, icon: cat.icon });
		if (cat.subcategories) {
			cat.subcategories.forEach((sub) => {
				flat.push({ name: sub.name, icon: sub.icon });
			});
		}
	});
	return flat;
};

export const categories = flattenCategories().map(({ name, icon }) => {
	const length = DATA.filter((d) => d.category.includes(name)).length;
	return { name, length, icon };
});

export const tags = [...new Set(DATA.flatMap((d) => d.tags).filter((t) => t !== ''))];

export const forBegginnerDevs = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes('Beginner developers'),
);
export const forDesigners = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes('Designers'),
);
export const forDevelopers = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes('Developers'),
);
export const forContentCreators = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes('Content Creators'),
);
export const forEducators = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes('Educators'),
);
/**
 * Returns a union of the given size from the different target audience categories.
 *
 * @param {number} size - The number of items to return from each category.
 * @returns {Array<{ name: string, data: Array<Tool> }>} - An array of objects, each containing the name of the category and an array of tools.
 */
export const union = (size: number): Array<{ name: string; data: Array<Tool> }> => [
	{ name: 'Beginner developers', data: forBegginnerDevs.slice(0, size) },
	{ name: 'Designers', data: forDesigners.slice(0, size) },
	{ name: 'Developers', data: forDevelopers.slice(0, size) },
	{ name: 'Content Creators', data: forContentCreators.slice(0, size) },
	{ name: 'Educators', data: forEducators.slice(0, size) },
];
