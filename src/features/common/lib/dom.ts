import type { PropsGlobalEventListener } from "@/features/common/types/dom";

export const $ = <T extends HTMLElement>(
	selector: string,
	context: Document | HTMLElement = document,
) => context.querySelector<T>(selector);
export const $$ = <T extends HTMLElement>(
	selector: string,
	context: Document | HTMLElement = document,
) => context.querySelectorAll<T>(selector);

export const globalEventListener = (
	event: keyof HTMLElementEventMap,
	{ selector, callback, context = document }: PropsGlobalEventListener,
) => {
	context.addEventListener(event, (e: Event) => {
		const target = e.target as Element;
		if (target.matches(selector)) callback(e);
	});
};
