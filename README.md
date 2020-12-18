# vscode-tailwindcss-twin

This is a custom Tailwind CSS IntelliSense VSCode Extension supports [twin](https://github.com/ben-rogerson/twin.macro) features.

---

## Supported

ONLY for React and twin.

## Recommended VS Code Settings

```json
{
  "editor.quickSuggestions": {
    "strings": true
  },
  "editor.autoClosingQuotes": "always"
}
```

### Notice

The extension will search your project to find out `tailwindcss` and `postcss` and execute them in the runtime, if they were not found, it will use the embedded version in extension.

Need to put `tailwind.config.js` in your workspace, or use default version config when it is not found.
