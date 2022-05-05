declare module "vscode-css-languageservice/lib/esm/services/lintRules" {
	import { LintSettings } from "vscode-css-languageservice/lib/esm/cssLanguageTypes"
	import * as nodes from "vscode-css-languageservice/lib/esm/parser/cssNodes"
	export class Rule implements nodes.IRule {
		id: string
		message: string
		defaultValue: nodes.Level
		constructor(id: string, message: string, defaultValue: nodes.Level)
	}
	export class Setting {
		id: string
		message: string
		defaultValue: any
		constructor(id: string, message: string, defaultValue: any)
	}
	export const Rules: {
		AllVendorPrefixes: Rule
		IncludeStandardPropertyWhenUsingVendorPrefix: Rule
		DuplicateDeclarations: Rule
		EmptyRuleSet: Rule
		ImportStatemement: Rule
		BewareOfBoxModelSize: Rule
		UniversalSelector: Rule
		ZeroWithUnit: Rule
		RequiredPropertiesForFontFace: Rule
		HexColorLength: Rule
		ArgsInColorFunction: Rule
		UnknownProperty: Rule
		UnknownAtRules: Rule
		IEStarHack: Rule
		UnknownVendorSpecificProperty: Rule
		PropertyIgnoredDueToDisplay: Rule
		AvoidImportant: Rule
		AvoidFloat: Rule
		AvoidIdSelector: Rule
	}
	export const Settings: {
		ValidProperties: Setting
	}
	export class LintConfigurationSettings {
		private conf
		constructor(conf?: LintSettings)
		getRule(rule: Rule): nodes.Level
		getSetting(setting: Setting): any
	}
}
