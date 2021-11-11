module.exports = {
	transform: {
		"^.+\\.(t|j)sx?$": "@swc/jest",
	},
	modulePathIgnorePatterns: ["examples"],
	moduleNameMapper: {
		"^~/(.*)": "<rootDir>/src/$1",
		"^@$": "<rootDir>/src/$1",
		"^@/(.*)": "<rootDir>/src/common/$1",
		"vscode-css-languageservice/lib/esm/(.*)": "vscode-css-languageservice/lib/umd/$1",
	},
}
