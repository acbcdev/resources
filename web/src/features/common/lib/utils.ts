import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * slugify takes a string and turns it into a slug. It
 * replaces forward slashes and whitespace with dashes and
 * converts the string to lowercase.
 * @param {string} tag - The string to be slugified.
 * @returns {string} The slugified string.
 * @example slugify("Hello World") // "hello-world"
 *
 */
export function slugify(tag: string): string {
	return tag
		.trim()
		.replace(/[\/\s\+\*]/g, "-")
		.replace(/[!¡@#$%^&*()]/g, "")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
}

/**
 * Rounds a number down to the nearest hundred.
 * @param {number} num - The number to be rounded.
 * @returns {number} The rounded number.
 * @example toHundreds(155) // 100
 *
 */
export function toHundreds(num: number): number {
	const value = Math.floor(num / 100) * 100;
	return value <= 0 ? 0 : value;
}
