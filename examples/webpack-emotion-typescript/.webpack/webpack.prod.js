const { register } = require("@swc-node/register/register")
const { readDefaultTsConfig } = require("@swc-node/register/read-default-tsconfig")
const path = require("path")
register(readDefaultTsConfig(path.join(__dirname, "tsconfig.json")))
module.exports = require("./webpack.prod.ts").default
