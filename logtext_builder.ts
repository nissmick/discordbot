import stringWidth from "string-width";

export class LogtextBuilder {
	constructor(private option?: { sanitize?: boolean }) {}
	private storage = new Map<string, string>();
	setItem(key: string, value: string) {
		if (this.option?.sanitize) {
			this.storage.set(sanitize(key), sanitize(value));
		} else {
			this.storage.set(key, value);
		}
		return this;
	}
	build() {
		const prebuild = new Map<string, string>();
		const prefixLength = Math.max(...[...this.storage.keys()].map((i) => i.length));
		for (const [key, value] of this.storage) {
			prebuild.set(padEnd(key, prefixLength, " "), value);
		}
		const build: string[] = [];
		for (const [key, value] of prebuild) {
			const [firstContent, ...content] = value.split("\n");
			build.push(
				`| ${key}: ${firstContent} `,
				...content.map((item) => "|" + " ".repeat(prefixLength) + item + " ")
			);
		}
		const linewidth = Math.max(...build.map((item) => stringWidth(item)));
		const output: string[] = [];
		output.push(`┌${"─".repeat(linewidth - 1)}┐`);
		build.map((i) => padEnd(i, linewidth, " ") + "|").forEach((item) => output.push(item));
		output.push(`└${"─".repeat(linewidth - 1)}┘`);
		return output;
	}
	toString() {
		return this.build().join("\n");
	}
}

function padEnd(str: string, targetWidth: number, padChar = " ") {
	const currentWidth = stringWidth(str);

	if (currentWidth >= targetWidth) {
		return str;
	}

	const paddingLength = targetWidth - currentWidth;
	const padding = padChar.repeat(paddingLength);

	return str + padding;
}

function sanitize(txt: string) {
	// eslint-disable-next-line no-control-regex
	return txt.replace(/\x1B/g, "\\e");
}
