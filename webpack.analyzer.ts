import { merge } from "webpack-merge"
import Visualizer from "webpack-visualizer-plugin2"
import config from "./webpack.config"

export default merge(config, {
	plugins: [
		new Visualizer({
			filename: "../statistics.html",
		}),
	],
})
