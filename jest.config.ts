export default {
	preset: "ts-jest",
	globals: {
		"ts-jest": {
			tsconfig: "<rootDir>/src/tsconfig.json",
		},
	},
	modulePathIgnorePatterns: ["examples"],
	moduleNameMapper: {
		"^~/(.*)": "<rootDir>/src/$1",
		"^@$": "<rootDir>/src/$1",
		"^@/(.*)": "<rootDir>/src/common/$1",
		"vscode-css-languageservice/lib/esm/(.*)": "vscode-css-languageservice/lib/umd/$1",
	},
}
