module.exports = {
	env: {
		es2021: true,
		node: true,
	},
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
	overrides: [
		{
			env: {
				node: true,
			},
			files: [".eslintrc.{js,cjs}"],
			parserOptions: {
				sourceType: "script",
			},
		},
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	plugins: ["@typescript-eslint"],
	rules: {
		indent: ["error", "tab", { SwitchCase: 1 }],
		"linebreak-style": ["error", "unix"],
		quotes: ["error", "double"],
		semi: ["error", "always"],
		// 命名規則縛りたいのに動かない気がするんです、どういうことなんでしょう、気のせいですこと?
		/*"@typescript-eslint/naming-convention": [
			"error",
			{
				selector: "typeLike",
				format: ["PascalCase"],
			},
			{
				selector: "variable",
				format: ["snake_case", "UPPER_CASE", "PascalCase"],
			},
			{
				selector: "function",
				format: ["camelCase"],
			}
		],*/
	},
};
