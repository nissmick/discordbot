# discord_bot

bun で動かす場合、`@google/generative-ai`パッケージで TextDecoderStream が存在しないというエラーが起きるはずです。
その場合は、polyfill/textdecorder.ts を読み込むようにパッケージのソースコードを改変してください。

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.0.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
