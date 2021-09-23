import { CleanWebpackPlugin } from "clean-webpack-plugin"
import ESLintPlugin from "eslint-webpack-plugin"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"
import path from "path"
import TsPathsResolvePlugin from "ts-paths-resolve-plugin"
import type { Compiler, Configuration } from "webpack"
import { ExternalsPlugin } from "webpack"
import WebpackBar from "webpackbar"

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

const clientWorkspaceFolder = path.resolve(__dirname, "client")
const serverWorkspaceFolder = path.resolve(__dirname, "server")

const configClient: Configuration = {
	target: "node",
	mode: process.env.NODE_ENV === "production" ? "production" : "development",
	devtool: "source-map",
	entry: path.join(clientWorkspaceFolder, "extension.ts"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "webpack://[resource-path]",
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules|\.test\.ts$/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [["@babel/preset-env", { targets: "node 10" }], "@babel/preset-typescript"],
							plugins: ["@babel/plugin-transform-runtime"],
						},
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
		new ESLintPlugin({ extensions: ["ts"] }),
		new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ["extension*"] }),
	],
}

const configServer: Configuration = {
	target: "node",
	mode: process.env.NODE_ENV === "production" ? "production" : "development",
	devtool: "source-map",
	entry: path.join(serverWorkspaceFolder, "server.ts"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "server.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "webpack://[resource-path]",
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules|\.test\.ts$/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [["@babel/preset-env", { targets: "node 10" }], "@babel/preset-typescript"],
							plugins: ["@babel/plugin-transform-runtime"],
						},
					},
				],
			},
			{
				test: /\.ya?ml$/,
				use: "js-yaml-loader",
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
		new ExternalsVendorPlugin("typescript"),
		new ESLintPlugin({ extensions: ["ts"] }),
		new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ["server*"] }),
		new WebpackBar({ color: "blue" }),
	],
}

export default [configClient, configServer]
