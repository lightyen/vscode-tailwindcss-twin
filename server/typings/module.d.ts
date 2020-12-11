declare module "*.yaml" {
	const data: Record<string, string>
	export default data
}

declare module "*.yml" {
	const data: Record<string, string>
	export default data
}
