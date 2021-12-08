# CHANGELOG.md

## 0.12.2

Enhance syntaxes(#28)

## 0.12.1

- Add new option: `hoverColorHint` (something like `rootFontSize` but for colors)
- Remove configurationDefaults from the extension
- Fix: Duplicate completion label

## 0.12.0

- Change color decoration style
- Remove `babel` and `ts-node`, replace with `swc`
- Render css preview with postcss
- Support classname `xxx-DEFAULT`
- Support `@apply` in user plugin
- Change vscode version to 1.60

## 0.11.7

- Enhance yarn2 feature
- Enhance diagnostics #27
- Enhance crash dump
- Enhance corePlugins

## 0.11.6

- Fix utilites complettion list after variant

## 0.11.5

- Fix variant completion item
- Arbitrary variant css beautify
- Enhance parser

## 0.11.4

- Disable auto-complete in arbitrary variant

## 0.11.3

- Support untitled
- Refactor parser
- Remove `eval()`

## 0.11.2

- Fix duplicate warnings [#24](https://github.com/lightyen/vscode-tailwindcss-twin/issues/24)
- Feature: document colors in css value (default to `false`)

## 0.11.1

- Fix using with default tailwind config

## 0.11.0

- Support arbitrary variant syntax
- Remove language server
- Detect activeTextEditor tab size
- Improve textmate grammars

## 0.10.4

- Fix parser

## 0.10.3

- Fix module importing
- Try to load tsconfig paths

## 0.10.2

- Fix config loading on yarn2
- Enhance screen variants sorting

## 0.10.1

- Fix sourcemap path
- Fix extension enable/disable feature

## 0.10.0

- Accept config file: `{tailwind,tailwind.config}.{ts,js,cjs}` (also accept esm export),

now you can write tailwind config like:

```ts
// tailwind.config.ts

import colors from "tailwindcss/colors"
import plugin from "tailwindcss/plugin"

delete colors.lightBlue

export default {
  theme: {
    extend: {
      colors: {
        ...colors,
        mycolor: require("./mycolor"),
      },
    },
  },
  plugins: [
    require("@tailwindcss/ui"),
    plugin(function ({ addComponents, addUtilities, addVariant, e  }) {
      //
    }),
  ],
} as Tailwind.ConfigJS
```

- Refactor: remove javascript syntax **class**, info message
- Add sourcemap for debug tracing
- Bump *tailwindcss* to 2.2.16
- Bump *postcss* to 8.3.8
- \[Experimental\] feature: arbitrary color with arbitrary opacity

## 0.9.5

- Change configuration value type
- Fix darkMode `"class"`

## 0.9.4

- Fix arbitrary value: ambiguous value type
- Change markdown preview: using css systax
- Enhance systaxes: css prop name starts with hyphen
- Enhance performance: reduce diagnostics count

## 0.9.3

- Disable comments in css value type `url()`
- hover arbitrary value: Disable in `cs` prop
- hover arbitrary value: Accept hex color
- completion resolve: Add detail to variants
- Enhance syntaxes
- Fix parser
- Bump tailwindcss to 2.2.15
- Bump typescript to 4.4.3

## 0.9.2

- Bump tailwindcss to 2.2.9
- Enhance syntaxes

## 0.9.1

- Fix shortcss syntax parsing ([#15](https://github.com/lightyen/vscode-tailwindcss-twin/issues/15))
- Enhance theme function completion
- Enhance screen function completion
- Bump tailwindcss to 2.2.8

## 0.9.0

- Support twin.macro v2.7.0
- Refactor parser
- Remove variant: `only-child:`

## 0.8.5

- Support twin.macro v2.4.2

## 0.8.4

- Target to Tailwind v2.1
- Completion *custom* css variable

### Enhances

- Don't show error on **camelCase** short css

## 0.8.3

show pixel value for **rem**

### Enhances

- the completion/hover content of custom plugin

## 0.8.2

### Fixes

- Ignore option: `purge`

## 0.8.1

refactor postcss ast traversal

### Changes

- disable color decoration for tailwind components

### Enhances

- textmate rules on short css (comment)
- completion content
- hover content
- show more debug message when initializing
- Ignore strict diagnostic at the specific utilities, ex: `transition`, `-opacity-`, ... and more.

## 0.8.0

### Changes

conflict rules(turn to non-strict mode for the particular utilities)
remove twin boolean option(no plan to support `className` prop)

### Fixes

- utilities completion list is not visiable

### Enhances

performance

## 0.7.8

### Fixes

- crash error happened when jsx tag is not closed and call `node.getChildren()`, ex: `<div tw="flex"`

## 0.7.7

### Fixes

- crash error happened when incomplete user input, ex: `<div tw=></div>`

## 0.7.6

### Changes

Ignore strict diagnostic at `transition` and `-opacity-` utilities.

### Enhances

Add i18n: `zh-tw`

## 0.7.5

### Fixes

fix completion css preview

### Enhances

support theme value with call expression

## 0.7.4

### Changes

- change classname regex

### Enhances

- add textmate rules for `cs` prop
- enhance short css property completion
- enhance variants completion

### Fixes

- should not show any suggestion in comments

## 0.7.3

### Changes

- treat motion-control variants as normal variants

### Enhance

- completion/hover on theme value
- completion on 'current'
- completion on single colon (you can get all variants by typing single colon.)

## 0.7.2

### Changes

- remove semantic highlight from lsp because of bad performance, and add textmate rules
- drop css checking when using css variable

### Enhance

- css value auto-completion

## 0.7.1

### Fixes

- parsing color value failed

### Changes

- allow multi alias when import twin
- vaidate short css
- semnatic token types

## 0.7.0

- allow comments
- support prefix

### Changes

- add setting: `enabled`
- add setting: `jsxPropImportChecking`
- add more new variants
- add more docs

## 0.6.5

Change gallery banner color

### Fixes

- fix resolving config at project which using yarn2

## 0.6.4

### Fixes

- bug: completion item content with 'transparent'

## 0.6.3

Change requirement of vscode to lower

## 0.6.2

### Fixes

- bug: hover on variants

## 0.6.1

### Fixes

- color decoration
- hover 'container' when trailing with '!'

### Changes

- change semantic tokens kind

## 0.6.0

Change user settings json structure.

### Change

refactor user settings type system

### Enhance

enhance diagnostics
enhance completion/hover

## 0.5.2

Add settings: `tailwindcss.diagnostics.emptyCssProperty`

### Enhances

- enhance short css value intellisense

## 0.5.1

### Changes

- revert: conflict check between "--tw" css variables

### Enhances

- add CHANGELOG
- add more references
- css prop completion

## 0.5.0

Add intellisense on [`short css syntax`](https://github.com/ben-rogerson/twin.macro/pull/305)

### Changes

- add setting: `tailwindcss.references`
- remove feature: **documentLinks**

### Enhances

- diagnostics

## 0.4.8

### Fixes

- fix critical error when using "cs" prop

### Changes

- refactor token object

### Enhances

enhance completion

## 0.4.7

### Enhances

- enhance intellisense on theme value

## 0.4.6

### Fixes

- fix auto completion when typing separator
- add document link: `cursor-help`

### Enhances

- enhance intellisense on theme value

## 0.4.5

Update tailwindcss version to `v2.0.3`

### Enhances

- make extension icon bigger

## 0.4.4

Add triggerCharacters: `['/', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']`

### Enhances

- enhance completion

## 0.4.3

Add setting: `tailwindcss.preferVariantWithParentheses`

### Fixes

hover result at the first position of token

### Enhances

- fault tolerance
- enhance completion
- add debounce with 100ms

## 0.4.2

### Enhances

- set **textDocumentSync.change** to `TextDocumentSyncKind.Incremental` (better performance)
- add more language support in `semanticTokensProvider`

## 0.4.1

### Fixes

- eol with CRLF (when using template string)
- validate 'content' and 'container'

### Changes

- refactor function findClasses()

## 0.4.0

support [`short css syntax`](https://github.com/ben-rogerson/twin.macro/pull/305)

### Changes

- the way of resolving user config
- extension keyword tags

## 0.3.4

### Changes

- change extension icon
- loose autocomplete variant filter

## 0.3.3

Change Display Name to "Tailwind Twin IntelliSense"

### Changes

- remove trigger characters ".", ":"
- bump up deps

### Enhances

performance (a little)

## 0.3.2

### Fixes

- AST traversing

## 0.3.1

Semantic Highlight (experimental)

### Changes

- activate the extension on start up
- support *corePlugins*

### Enhances

variant groups parsing

## 0.3.0

- no support html file and 'className' prop anymore
- use default tailwindcss and postcss library (extension embeded)

### Fixes

- add simple quick fix on diagnostics

### Enhances

- debug message

## 0.2.1

### Fixes

- theme auto-completion

## 0.2.0

Use typescript API to parse template strings

### Changes

- remove extension setting: twin, always to `true`

## 0.0.3

### Enhances

- diagnostics

## 0.0.2

### Fixes

- document links

## 0.0.1

First Release
