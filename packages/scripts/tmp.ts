import data from "./data/scripts-output/backupScreenshots.json";

const ogImages = data.filter((i) => i.og?.image);
const screenshots = data.filter((i) => i.image_source === "screenshot");

console.log("Total items:", data.length);
console.log("Items with OG image:", ogImages.length);
console.log("Items with screenshots:", screenshots.length);
console.log(
  "Sample OG image URLs:",
  data.length === ogImages.length + screenshots.length,
);
console.log(ogImages.length + screenshots.length);
