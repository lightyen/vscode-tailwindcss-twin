import packageJSON from "../package.json"

import path from "path"
import { EnvironmentPlugin } from "webpack"
import { Configuration } from "webpack"

// Plugins
import HtmlWebpackPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import WebpackBarPlugin from "webpackbar"
import TsPathsResolvePlugin from "ts-paths-resolve-plugin"
import glob from "glob"

export default function (): Configuration {
	const workspaceFolder = path.resolve(__dirname, "..")
	const isDev = process.env.NODE_ENV !== "production"
	const outputCSS = "css"
	const outputJS = "js"
	const publicPath = "/"

	const src = path.resolve(workspaceFolder, "src")
	const dist = path.resolve(workspaceFolder, "build")

	const join_network = (...args: string[]) => path.join(...args).replace(path.sep, "/")

	const indices = glob.sync("index.*", { cwd: src })

	const entry: Configuration["entry"] = indices.map(i => path.resolve(src, i))

	const styleLoader = {
		loader: isDev ? "style-loader" : MiniCssExtractPlugin.loader,
		options: {
			...(!isDev && { publicPath: path.relative(path.join(publicPath, outputCSS), publicPath) }),
		},
	}

	return {
		target: "web",
		plugins: [
			new WebpackBarPlugin({ color: "blue", name: "React" }),
			new EnvironmentPlugin({
				NODE_ENV: "development",
				PUBLIC_URL: "",
				APP_NAME: packageJSON.name,
			}),
			new MiniCssExtractPlugin({
				filename: join_network(outputCSS, "[name].css?[fullhash]"),
				chunkFilename: join_network(outputCSS, "[name].chunk.css?[fullhash:8]"),
			}),
			new HtmlWebpackPlugin({
				title: "React App",
				inject: true,
				minify: true,
				template: path.join(workspaceFolder, "public", "index.html"),
				favicon: path.join(workspaceFolder, "public", "favicon.ico"),
			}),
		],
		// NOTE: https://webpack.js.org/configuration/resolve/
		resolve: {
			extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
			plugins: [new TsPathsResolvePlugin({ tsConfigPath: path.resolve(src, "tsconfig.json") })],
		},
		entry,
		output: {
			path: dist,
			filename: join_network(outputJS, "[name].js?[fullhash]"),
			chunkFilename: join_network(outputJS, "[name].js?.[fullhash:8]"),
			publicPath,
		},
		module: {
			rules: [
				{
					test: /\.(j|t)sx?$/,
					exclude: /node_modules|__tests?__|\.test\.(j|t)sx?$|\.worker\.(j|t)s$/,
					use: ["babel-loader"],
				},
				{
					test: /\.worker\.(j|t)s$/,
					exclude: /node_modules/,
					use: ["worker-loader", "babel-loader"],
				},
				{
					test: /\.(png|jpe?g|gif|ico)$/i,
					type: "asset",
					parser: {
						dataUrlCondition: {
							maxSize: 4 << 10,
						},
					},
					generator: {
						filename: join_network("img", "[hash][ext]"),
					},
				},
				{
					test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
					type: "asset/resource",
					generator: {
						filename: join_network("fonts", "[hash][ext]"),
					},
				},

				{
					test: /\.svg$/,
					use: ["babel-loader", "@svgr/webpack"],
				},
				{
					test: /\.ya?ml$/,
					use: "js-yaml-loader",
				},
				// For user space:
				{
					exclude: /node_modules/,
					test: /\.css$/,
					use: [
						styleLoader,
						{
							loader: "css-loader",
							options: {
								url: true,
								sourceMap: true,
							},
						},
					],
				},
				// For node_modules:
				{
					include: /node_modules/,
					test: /.css$/,
					use: [styleLoader, "css-loader"],
				},
			],
		},
	}
}
