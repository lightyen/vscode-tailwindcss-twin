# Tailwind Twin IntelliSense

This is a custom Tailwind CSS IntelliSense VSCode Extension which supports [twin.macro](https://github.com/ben-rogerson/twin.macro) features.

## Support

ONLY for React and twin.macro

## VS Code Settings

### Recommended

```json5
{
  "editor.quickSuggestions": { "strings": true },
  "editor.autoClosingQuotes": "always"
}
```

### Default

```json5
{
  "tailwindcss.colorDecorators": null, // inherit from "editor.colorDecorators"
  "tailwindcss.links": null, // inherit from "editor.links"
  "tailwindcss.validate": true,
  "tailwindcss.diagnostics.emptyClass": true,
  "tailwindcss.diagnostics.emptyGroup": true,
  "tailwindcss.diagnostics.conflict": "strict",
  "tailwindcss.fallbackDefaultConfig": true
}
```

### Semantic Highlight (Experimental)

```json5
{
  "editor.semanticTokenColorCustomizations": {
    "enabled": true
  }
}
```
