import * as fs from "node:fs/promises";
import { rimraf } from "rimraf";
import process from "../src/process";

beforeAll(async () => {
	await rimraf("tests/output/**/*.mdx", { glob: true });
});

const i = (basename: string): string => `tests/input/${basename}.md`;
const o = (basename: string): string => `tests/output/${basename}.mdx`;
const outputPath = "tests/output";

test("should abort on files without frontmatter", async () => {
	const basename = "no-frontmatter";
	const input = await fs.readFile(i(basename));
	await expect(
		process({ basename, content: input.toString("utf8"), outputPath }),
	).rejects.toThrow("Invalid file: needs both frontmatter and content");
});

test("copy a simple file", async () => {
	const basename = "simple";
	const input = await fs.readFile(i(basename));
	await process({ basename, content: input.toString("utf8"), outputPath });
	const output = await fs.readFile(o(basename));
	expect(input).toEqual(output);
});

describe("slugify the filename", () => {
	test("based on the original filename", async () => {
		const basename = "Careful Now";
		const input = await fs.readFile(i(basename));
		await process({ basename, content: input.toString("utf8"), outputPath });
		const output = await fs.readFile(o("careful-now"));
		expect(input).toEqual(output);
	});

	test("based on the frontmatter", async () => {
		const basename = "custom-slug";
		const input = await fs.readFile(i(basename));
		await process({ basename, content: input.toString("utf8"), outputPath });
		const output = await fs.readFile(o("fancy-custom-slug"));
		expect(input).toEqual(output);
	});
});

test("remove notes from the end of the file", async () => {
	const basename = "with-private-notes";
	const input = await fs.readFile(i(basename));
	await process({ basename, content: input.toString("utf8"), outputPath });
	const output = await fs.readFile(o("with-private-notes"));
	const expected = `---
---
content

`;

	expect(output.toString("utf8")).toEqual(expected);
});

test("strip wikilinks", async () => {
	const basename = "with-wikilinks";
	const input = await fs.readFile(i(basename));
	await process({ basename, content: input.toString("utf8"), outputPath });
	const output = await fs.readFile(o("with-wikilinks"));
	const expected = `---
---
here is a link. and another
and even more!
`;

	expect(output.toString("utf8")).toEqual(expected);
});

describe("put files in a subdirectory", () => {
	test("based on type frontmatter property", async () => {
		const basename = "with-type";
		const input = await fs.readFile(i(basename));
		await process({ basename, content: input.toString("utf8"), outputPath });
		const output = await fs.readFile(o(`media/${basename}`));
		expect(input).toEqual(output);
	});

	test("based on defaultSubdir setting", async () => {
		const basename = "simple";
		const input = await fs.readFile(i(basename));
		await process({
			basename,
			content: input.toString("utf8"),
			defaultSubdir: "media",
			outputPath,
		});
		const output = await fs.readFile(o(`media/${basename}`));
		expect(input).toEqual(output);
	});
});
