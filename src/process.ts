import * as fs from "node:fs/promises";
import slugify from "slugify";
import { parse as parseYaml } from "yaml";
import pipe from "./pipe";

interface Process {
	basename: string | undefined;
	content: string;
	defaultSubdir?: string;
	outputPath: string;
}

export default async function process({
	basename,
	content,
	defaultSubdir,
	outputPath,
}: Process): Promise<string> {
	const split = content.split("---");
	if (split.length !== 3) {
		throw new Error("Invalid file: needs both frontmatter and content");
	}
	if (!basename) {
		throw new Error("Give me the basename");
	}

	const frontmatter = parseYaml(split[1]) || {};
	// use slug from frontmatter, else slugify original filename
	const slug = slugify(frontmatter.slug || basename, {
		lower: true,
		strict: true,
	});
	const outputContent = pipe(stripWikilinks, removeNotes)(content);
	const outputFile = [
		outputPath,
		frontmatter.type || defaultSubdir,
		`${slug}.mdx`,
	]
		.filter(Boolean)
		.join("/");

	await fs.writeFile(outputFile, outputContent);
	return outputFile;
}

const removeNotes = (content: string): string =>
	content.replace(/## Notes.*/s, "");

const stripWikilinks = (content: string): string => {
	// ([^\!]) capture, any char that isn't ! (to exclude media embeds)
	// \[\[ 
	// ([^\]]+) capture, any characters that aren't ]] or newline
	// \]\]
	return content.replace(/([^\!])\[\[([^\]]+)\]\]/gm, (match, before, linkText) => {
		return `${before}${linkText}`;
	});
};