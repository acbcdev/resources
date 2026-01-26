export type PropsGlobalEventListener = {
	selector: string;
	callback: (e: Event) => void;
	context?: Document | HTMLElement;
};
