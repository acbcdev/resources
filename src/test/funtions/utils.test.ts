import { expect, test, describe } from "vitest";
import { slugify, toHundreds } from "@/lib/utils";

describe("slugify", () => {
	test("should return a slugified string", () => {
		const tag = "Hello World";
		const slug = slugify(tag);
		expect(slug).toBe("hello-world");
	});

	test("should return a slugified string with trim", () => {
		const tag = "Hello World ";
		const slug = slugify(tag);
		expect(slug).toBe("hello-world");
	});

	test("should return a slugified string with forward slashes", () => {
		const tag = "Hello/World";
		const slug = slugify(tag);
		expect(slug).toBe("hello-world");
	});

	test("should return a slugified string with forward slashes and spaces", () => {
		const tag = "Hello/World ";
		const slug = slugify(tag);
		expect(slug).toBe("hello-world");
	});
	test("should remove leading and trailing whitespace", () => {
		expect(slugify("   Hello World   ")).toBe("hello-world");
	});

	test("should replace special characters with hyphens", () => {
		expect(slugify("Hello/World+*")).toBe("hello-world");
	});

	test("should return a slugified string with forward slashes and spaces", () => {
		const tag = "Hello/World*+ ";
		const slug = slugify(tag);
		console.log(slug);
		expect(slug).toBe("hello-world");
	});
	test("should convert to lowercase", () => {
		expect(slugify("HELLO WORLD")).toBe("hello-world");
	});
	test("should handle empty string", () => {
		expect(slugify("")).toBe("");
	});
	test("should handle single word", () => {
		expect(slugify("hello")).toBe("hello");
	});
	test("should handle single word", () => {
		expect(slugify("hello")).toBe("hello");
	});
	test("should handle non-ASCII characters", () => {
		expect(slugify("¡hola!")).toBe("hola");
	});
	test("should handle leading and trailing whitespace with special characters", () => {
		expect(slugify("   hello!@#$%^&*()   ")).toBe("hello");
	});
	test("should handle edge case with multiple consecutive special characters", () => {
		expect(slugify("hello!!!@#$%^&*()")).toBe("hello");
	});
});

describe("toHundreds", () => {
	test("should return the nearest hundred", () => {
		expect(toHundreds(155)).toBe(100);
	});

	test("should return the nearest hundred", () => {
		expect(toHundreds(34)).toBe(0);
	});

	test("should return the nearest hundred", () => {
		expect(toHundreds(25)).toBe(0);
	});

	test("should return the nearest hundred", () => {
		expect(toHundreds(0)).toBe(0);
	});

	test("should return the nearest hundred", () => {
		expect(toHundreds(-1)).toBe(0);
	});
});
