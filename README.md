# Tailwind Twin IntelliSense

This is a Tailwind CSS IntelliSense VSCode Extension which supports [twin.macro](https://github.com/ben-rogerson/twin.macro) features.

## Features

- auto completion
- hover
- color decoration
- document references
- diagnostics

## Supported

Support ONLY `react` and `twin.macro`

## VSCode Settings

### Recommended

```json5
{
  // none
}
```

### Defaults

```json5
{
  "tailwindcss.colorDecorators": null, // inherit from "editor.colorDecorators"
  "tailwindcss.references": true,
  "tailwindcss.diagnostics": {
    "enabled": true,
    "conflict": "strict",
    "emptyClass": true,
    "emptyGroup": true,
    "emptyCssProperty": true
  },
  "tailwindcss.preferVariantWithParentheses": false,
  "tailwindcss.fallbackDefaultConfig": true,
  "tailwindcss.enabled": true,
  "tailwindcss.jsxPropImportChecking": true
}
```

### Semantic Highlight (Experimental)

```json5
// example
{
  "editor.semanticTokenColorCustomizations": {
    "[Atom One Dark]": {
      "enabled": true,
      "rules": {
        "important": "#6e90ff"
      }
    },
    "[Dracula]": {
      "enabled": true,
      "rules": {
        "important": "#77f13e"
      }
    }
  }
}

```

#### semantic token types (Experimental)

| type             |
| ---------------- |
| className        |
| variant          |
| bracket          |
| important        |
| shortCssProperty |
| shortCssValue    |
| shortCssBracket  |
| themeKey         |
| themeBracket     |
| comment          |

### Custom CompletionList Panel

```json5
// example
{
  "workbench.colorCustomizations": {
    "[Atom One Dark]": {
      "editorHoverWidget.background": "#17202ee5",
      "editorHoverWidget.border": "#6a7473",
      "editorSuggestWidget.background": "#17202ee5",
      "editorSuggestWidget.border": "#6a7473",
      "editorSuggestWidget.selectedBackground": "#009c70d0",
      "editor.wordHighlightBackground": "#0000"
    }
  }
}
```
