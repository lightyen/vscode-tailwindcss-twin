# Tailwind Twin IntelliSense

This is a custom Tailwind CSS IntelliSense VSCode Extension which supports [twin.macro](https://github.com/ben-rogerson/twin.macro) features.

## Supported

ONLY for React and `twin.macro`

## VS Code Settings

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
  "tailwindcss.fallbackDefaultConfig": true
}
```

### Semantic Highlight (Experimental)

```json5
{
  "editor.semanticHighlighting.enabled": "configuredByTheme",
  "editor.semanticTokenColorCustomizations": {
    "enabled": true,
    "[Atom One Dark]": {
      "rules": {
        "operator": "#5177f5"
      }
    }
  },
}
```

### Custom CompletionList Panel

```json5
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
