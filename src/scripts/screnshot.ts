import { chromium } from "playwright";
import DATA from "@/features/common/data/data.json";
import backup from "@/features/common/data/backup.json";
async function getScreenshot(url: string) {
  const browser = await chromium.launch({
    headless: true,
    timeout: 5000,
  });
  try {
    const page = await browser.newPage();
    await page.goto(url);
    const urlPage = new URL(url);
    const route = `./screenshots/${urlPage.hostname}-${urlPage.pathname.replace(/\//g, '-')}.jpeg`;
    await page.screenshot({ path: route, type: 'jpeg', timeout: 1000 });

    return route;
  }
  catch (error) {
    console.log(error);
    return false;
  }
  finally {
    await browser.close();
  }
}

const rta = [...backup];
const links = rta.map(({ url }) => url);
for (const item of DATA) {
  if (links.includes(item.url)) continue;
  if (item.og.image) {
    console.log('Imagen de og', item.og.image);
    rta.push({ ...item });
    continue;
  }
  console.log(rta.length);
  const screenshot = await getScreenshot(item.url);
  if (!screenshot) {
    console.log('No se pudo capturar el screenshot de', item.url);
    continue;
  }
  console.log(screenshot);
  rta.push({ ...item, image: screenshot });

  console.log(`<----${rta.length}---->`);
  console.log(`<----${rta.length} /${DATA.length}---->`);

  await Bun.write('./src/data/backup.json', JSON.stringify(rta, null, 2));
}

console.log('Fin');
console.log(rta.length);
await Bun.write('./src/data/withScreenshot.json', JSON.stringify(rta, null, 2));