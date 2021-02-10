import { getDefaultCSSDataProvider } from "vscode-css-languageservice"
const provider = getDefaultCSSDataProvider()
const cssProps = provider.provideProperties()
export default cssProps
