# Tailwind Twin IntelliSense

This is a Tailwind CSS IntelliSense VSCode Extension which supports [twin.macro](https://github.com/ben-rogerson/twin.macro) features.

## Features

- auto completion
- hover
- color decoration
- document references
- diagnostics

## Supported

Support ONLY react and `twin.macro` now.

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
  "tailwindcss.fallbackDefaultConfig": true
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
        "operator": "#6e90ff"
      }
    },
    "[Dracula]": {
      "enabled": true,
      "rules": {
        "interface": "#77f13e"
      }
    }
  }
}

```

#### Mapping Table (Experimental)

| Type        | target     |
| :---------- | :--------- |
| Variant     | interface  |
| Classname   | enumMember |
| CssProperty | function   |
| Brackets    | variable   |
| Important   | operator   |

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
