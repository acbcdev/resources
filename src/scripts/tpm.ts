import newJson from "@/features/common/data/new.json";

const newData = newJson.map((item) => item.href);

console.log(newData);

await Bun.write("./src/data/tpm.json", JSON.stringify(newData, null, 2));
