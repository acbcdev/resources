import { DATA } from 'web/src/data';

export const collectionNames = [
	'Devs Beginner',
	'Desing',
	'Animations',
	'Design Tools',
	'Mockups',
	'A Good Blog',
] as const;
type TCollection = {
	name: string;
	description: string;
	img: string;
};
export const collectionDescriptions: TCollection[] = [
	{ name: 'Devs Beginner', description: '', img: '' },
	{ name: 'Desing', description: '', img: '' },
	{ name: 'Animations', description: '', img: '' },
	{ name: 'Design Tools', description: '', img: '' },
	{ name: 'Mockups', description: '', img: '' },
	{ name: 'A Good Blog', description: '', img: '' },
] as const;

export const ALLCOLLECTIONS = [
	...new Set(DATA.flatMap(({ collections }) => collections).filter(Boolean)),
];

export const collections = collectionDescriptions
	.map((i) => {
		if (i) {
			const data = DATA.filter((d) =>
				d.collections?.includes(i.name as (typeof collectionNames)[number]),
			);
			return { ...i, data };
		}
	})
	.filter(Boolean);
