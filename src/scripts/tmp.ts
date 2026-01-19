import data from '@/data/data.json';
import data2 from '@/data/data2.json';
import data3 from '@/data/pending.json';
import { DATA } from '@/data/index.ts';

const urls = [data, data2, data3.map((i) => i.url), DATA.map((i) => i.url)].flat();

console.log(urls.length);
console.log(new Set(urls).size);
const uniqueUrls = Array.from(new Set(urls));
console.log(uniqueUrls.length);
console.log(uniqueUrls.slice(0, 10));

try {
	await Bun.write('new.json', JSON.stringify(uniqueUrls, null, 2));
} catch (e) {
	console.log(e);
}
