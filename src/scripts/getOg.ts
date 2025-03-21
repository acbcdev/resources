import { chromium } from "playwright";
import newdata from "@/data/new.json";
import backup from "@/data/backuoOG.json";
async function getOg(url: string) {
	const browser = await chromium.launch({
		headless: true,
		timeout: 10000,
	});
	try {
		const page = await browser.newPage();
		await page.goto(url);
		const og = await page.evaluate(() => {
			return {
				title:
					document
						.querySelector('meta[property="og:title"]')
						?.getAttribute("content") || undefined,
				url:
					document
						.querySelector('meta[property="og:url"]')
						?.getAttribute("content") || undefined,
				image:
					document
						.querySelector('meta[property="og:image"]')
						?.getAttribute("content") || undefined,
				descripcion:
					document
						.querySelector('meta[property="og:description"]')
						?.getAttribute("content") || undefined,
				type:
					document
						.querySelector('meta[property="og:type"]')
						?.getAttribute("content") || undefined,
				site_name:
					document
						.querySelector('meta[property="og:site_name"]')
						?.getAttribute("content") || undefined,
				video:
					document
						.querySelector('meta[property="og:video"]')
						?.getAttribute("content") || undefined,
				icon:
					document.querySelector('link[rel="icon"]')?.getAttribute("href") ||
					undefined,
			};
		});
		return og;
	} catch (err) {
		console.error(err);
		return {
			title: undefined,
			url: undefined,
			image: undefined,
			descripcion: undefined,
			type: undefined,
			site_name: undefined,
			video: undefined,
			icon: undefined,
		};
	} finally {
		await browser.close();
	}
}

const rta: { og: unknown; url: string }[] = [...backup];
const links = rta.map((i) => i.url);
let counter = 0;
let counterOg = 0;
for (const url of newdata) {
	if (links.includes(url)) continue;
	console.log(url);

	const og = await getOg(url);
	console.log(og.image);

	rta.push({ og, url });
	counter++;
	if (og.image) counterOg++;
	console.log(`<----${counter}---->`);
	console.log(`<----with og ${counterOg}---->`);

	console.log(`${rta.length} /${newdata.length}`);
	await Bun.write("./src/data/backuoOG.json", JSON.stringify(rta, null, 2));
}

await Bun.write("./src/data/newOg.json", JSON.stringify(rta, null, 2));
