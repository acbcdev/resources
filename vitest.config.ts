import { getViteConfig } from "astro/config";

export default getViteConfig({
	test: {
		alias: {
			"@/": "./src/*",
		},
	},
});
