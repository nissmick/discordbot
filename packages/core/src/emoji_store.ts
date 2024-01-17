type Emoji = {
	aliases: string[];
	name: string;
	category: string;
	url: string;
};

type CacheData = {
	cached_at: Date;
	data: Emoji[];
};
type Cache = Map<string, CacheData>;

const FailedCount: Map<string, number> = new Map();
const Cache: Cache = new Map();
type EmojiResponse = { emojis: Emoji[] };
async function fetchEmojiWithCache(url: `https://${string}/api/emojis`, cache: boolean = true) {
	const now = new Date();
	const cached = Cache.get(url);
	const count = FailedCount.get(url);
	// 失敗し過ぎ、諦めた方がいい
	if (count && count > 5) {
		return null;
	}
	if (cache && cached && now.valueOf() - cached.cached_at.valueOf() < 1000 * 60 * 5) {
		// console.log("use cache");
		return cached.data;
	} else {
		console.log(`fetching to ${url}`);
		try {
			const res = await fetch(url);
			const json = (await res.json()) as EmojiResponse;
			const data = json.emojis;
			Cache.set(url, {
				cached_at: new Date(),
				data,
			});
			return data;
		} catch (error: unknown) {
			FailedCount.set(url, (count || 0) + 1);
			return null;
		}
	}
}

export class EmojiProvider {
	domain: string;
	map: Map<string, Emoji>;
	constructor(domain = "misskey.io") {
		this.domain = domain;
		this.map = new Map<string, Emoji>();
	}
	async fetch(usecache: boolean) {
		const emojis = await fetchEmojiWithCache(`https://${this.domain}/api/emojis`, usecache);
		if (emojis === null) {
			return null;
		}
		emojis.forEach((e) => {
			this.map.set(e.name, e);
		});
	}
	get(name: string) {
		return this.map.get(name);
	}
	getUnWrap(name: string): Emoji {
		const item = this.get(name);
		if (item) {
			return item;
		} else {
			throw Error("emoji not found");
		}
	}
}

class EmojiRepository {
	domains: Set<string>;
	storage: Map<string, EmojiProvider>;
	constructor() {
		this.domains = new Set<string>();
		this.storage = new Map<string, EmojiProvider>();
	}
	add(domain: string) {
		if (this.domains.has(domain)) return;
		const store = new EmojiProvider(domain);
		this.domains.add(domain);
		this.storage.set(domain, store);
	}
	get(domain: string) {
		return this.storage.get(domain);
	}
	has(domain: string) {
		return this.domains.has(domain);
	}
	async fetchAll(usecache: boolean = true) {
		const values = [...this.storage.values()];
		for (const item of values) {
			await item.fetch(usecache);
		}
	}
}

export class EmojiResolver {
	PATH: Set<string>;
	private repository: EmojiRepository;
	constructor(...domains: string[]) {
		this.PATH = new Set<string>(domains);
		this.repository = new EmojiRepository();
		this.PATH.forEach((domain) => {
			this.repository.add(domain);
		});
	}
	async fetchAll(usecache: boolean = true) {
		await this.repository.fetchAll(usecache);
	}
	get(emoji_name: string, path_overwrite: string[] = []) {
		const path = [...path_overwrite, ...this.PATH.keys()];
		for (const domain of path) {
			const provider = this.repository.get(domain)!;
			const emoji = provider.get(emoji_name);
			if (emoji) {
				return emoji;
			}
		}
		return null;
	}
	query(partial_match: string[]): Map<string, Emoji[]>;
	query(match: RegExp): Map<string, Emoji[]>;
	query(partial_match: string[] | RegExp): Map<string, Emoji[]> {
		let match: RegExp;
		if (partial_match instanceof RegExp) {
			match = partial_match;
		} else {
			match = new RegExp(partial_match.join(".*?"));
		}
		const path = this.PATH.keys();
		const result: Map<string, Emoji[]> = new Map();
		for (const domain of path) {
			const provider = this.repository.get(domain)!;
			const filted = [...provider.map.values()].filter((emoji) => match.test(emoji.name));
			result.set(domain, [...filted]);
		}
		return result;
	}
}
