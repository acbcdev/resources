import { CATEGORIES } from "@/features/categories/types/category";
import type { Tool } from "@/features/resources/types/resource";
import { DATA } from "@/data";

export const categories = CATEGORIES.map(({ name, icon }: { name: string; icon: any }) => {
	const length = DATA.filter((d) => d.category.includes(name)).length;
	return { name, length, icon };
});

export const tags = [
	...new Set(DATA.flatMap((d) => d.tags).filter((t) => t !== "")),
];
// export const tags = DATA.flatMap((d) => d.tags).filter((t) => t !== '');

export const forBegginnerDevs = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes("Beginner developers"),
);
export const forDesigners = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes("Designers"),
);
export const forDevelopers = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes("Developers"),
);
export const forContentCreators = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes("Content Creators"),
);
export const forEducators = DATA.filter(({ targetAudience }) =>
	targetAudience?.includes("Educators"),
);
/**
 * Returns a union of the given size from the different target audience categories.
 *
 * @param {number} size - The number of items to return from each category.
 * @returns {Array<{ name: string, data: Array<Tool> }>} - An array of objects, each containing the name of the category and an array of tools.
 */
export const union = (
	size: number,
): Array<{ name: string; data: Array<Tool> }> => [
	{ name: "Beginner developers", data: forBegginnerDevs.splice(0, size) },
	{ name: "Designers", data: forDesigners.splice(0, size) },
	{ name: "Developers", data: forDevelopers.splice(0, size) },
	{ name: "Content Creators", data: forContentCreators.splice(0, size) },
	{ name: "Educators", data: forEducators.splice(0, size) },
];
