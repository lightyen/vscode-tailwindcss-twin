import path from "path"
import { ExternalsPlugin } from "webpack"
import type { Configuration, Compiler } from "webpack"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"
import ESLintPlugin from "eslint-webpack-plugin"
import TsPathsResolvePlugin from "ts-paths-resolve-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import { merge } from "webpack-merge"

class ExternalsVendorPlugin {
	externals: Record<string, string>
	constructor(...deps: string[]) {
		this.externals = {}
		for (const dep of deps) {
			this.externals[dep] = dep
		}
	}
	apply(compiler: Compiler) {
		new ExternalsPlugin("commonjs", this.externals).apply(compiler)
	}
}

const base: Configuration = {
	target: "node",
	mode: process.env.NODE_ENV === "production" ? "production" : "development",
	output: {
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "../[resource-path]",
	},
	module: {
		rules: [
			{
				test: /\.ya?ml$/,
				use: "js-yaml-loader",
			},
		],
	},
	devtool: process.env.NODE_ENV === "production" ? "inline-source-map" : "source-map",
	plugins: [new ESLintPlugin({ extensions: ["ts"] })],
}

const clientWorkspaceFolder = path.resolve(process.cwd(), "client")
const serverWorkspaceFolder = path.resolve(process.cwd(), "server")

const configClient = merge(base, {
	entry: path.join(clientWorkspaceFolder, "extension.ts"),
	output: {
		path: path.resolve(process.cwd(), "out/client"),
		filename: "extension.js",
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules|\.test\.ts/,
				use: [
					{
						loader: "ts-loader",
						options: { happyPackMode: true, context: path.resolve(clientWorkspaceFolder, "tsconfig.json") },
					},
				],
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js", ".json"],
		plugins: [new TsPathsResolvePlugin({ tsConfigPath: path.resolve(clientWorkspaceFolder, "tsconfig.json") })],
	},
	plugins: [
		new ForkTsCheckerPlugin({
			typescript: {
				configFile: path.resolve(clientWorkspaceFolder, "tsconfig.json"),
			},
		}),
		new ExternalsVendorPlugin("vscode"),
		new CleanWebpackPlugin({ cleanAfterEveryBuildPatterns: ["**/*", "!server*"] }),
	],
})

const configServer = merge(base, {
	entry: path.join(serverWorkspaceFolder, "server.ts"),
	output: {
		path: path.resolve(process.cwd(), "out/server"),
		filename: "server.js",
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules|\.test\.ts/,
				use: [
					{
						loader: "ts-loader",
						options: { happyPackMode: true, context: path.resolve(serverWorkspaceFolder, "tsconfig.json") },
					},
				],
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js", ".json"],
		plugins: [new TsPathsResolvePlugin({ tsConfigPath: path.resolve(serverWorkspaceFolder, "tsconfig.json") })],
	},
	plugins: [
		new ForkTsCheckerPlugin({
			typescript: {
				configFile: path.resolve(serverWorkspaceFolder, "tsconfig.json"),
			},
		}),
		new CleanWebpackPlugin({ cleanAfterEveryBuildPatterns: ["**/*", "!client*"] }),
	],
})

export default [configClient, configServer]
