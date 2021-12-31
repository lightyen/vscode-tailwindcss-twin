module.exports = {
	transform: {
		"^.+\\.(t|j)sx?$": "@swc/jest",
	},
	moduleNameMapper: {
		"^~/(.*)": "<rootDir>/src/$1",
		"^assets/(.*)": "<rootDir>/src/assets/$1",
	},
}
