import { z } from 'zod';

export const TARGETAUDIENCE = [
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
] as const;

export const TargetAudienceSchema = z.enum(TARGETAUDIENCE);
export type TargetAudience = z.infer<typeof TargetAudienceSchema>;
