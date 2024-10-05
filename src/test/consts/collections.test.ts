import { expect, test, describe } from "vitest";
import { collectionDescriptions, collectionNames } from "@/consts/collections";

describe("collections", () => {
	test("should return an array", () => {
		expect(collectionDescriptions).toBeInstanceOf(Array);
	});
	test("should return an array of objects", () => {
		expect(collectionDescriptions).toBeInstanceOf(Array);
		expect(collectionDescriptions[0]).toHaveProperty("name");
		expect(collectionDescriptions[0]).toHaveProperty("description");
		expect(collectionDescriptions[0]).toHaveProperty("img");
	});
	test("should have the same length as collectionNames", () => {
		expect(collectionDescriptions.length).toBe(collectionNames.length);
	});
	test("should have the same names ", () => {
		const names = collectionDescriptions.map((i) => i.name).toSorted();
		const collcNames = collectionNames.toSorted();
		expect(names).toStrictEqual(collcNames);
	});
});
