# codelens-golang-navigate

[![CI](https://github.com/hu553in/codelens-golang-navigate/actions/workflows/ci.yml/badge.svg)](https://github.com/hu553in/codelens-golang-navigate/actions/workflows/ci.yml)
[![Open VSX Version](https://img.shields.io/open-vsx/v/hu553in/codelens-golang-navigate)](https://open-vsx.org/extension/hu553in/codelens-golang-navigate)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/hu553in.codelens-golang-navigate)](marketplace.visualstudio.com/items?itemName=hu553in.codelens-golang-navigate)

- [License](./LICENSE)
- [How to contribute](./CONTRIBUTING.md)
- [Code of conduct](./CODE_OF_CONDUCT.md)

A Visual Studio Code extension that adds **CodeLens actions** and **trusted hover links** for fast,
low-friction navigation in Go code.

The extension is designed to feel native, stay out of the way, and scale well on large Go projects.

---

## Features

### CodeLens navigation

For Go symbols, the extension displays CodeLens actions directly above declarations:

```
🔍 Definition · 🏷️ Type definition · ⚙️ Implementations · 🏗️ Type hierarchy · 📞 Callers · 🔗 References
```

CodeLens behavior:

- Automatically refreshed while typing (with debouncing)
- Powered by `gopls` through Visual Studio Code document symbol provider
- Updated only for the currently active Go editor

### Hover navigation

When hovering over a Go symbol, the same navigation actions appear as clickable links:

```
🔍 Definition · 🏷️ Type definition · ⚙️ Implementations · 🏗️ Type hierarchy · 📞 Callers · 🔗 References
```

Hover links are trusted and invoke the corresponding built-in Visual Studio Code navigation commands.

### Performance-focused

- Document symbols are cached per file version
- CodeLens refresh is debounced and configurable
- No background processing for inactive editors

---

## Prerequisites

- Go installed: https://go.dev/doc/install
- Go extension for Visual Studio Code: https://marketplace.visualstudio.com/items?itemName=golang.go
- `gopls` language server: https://github.com/golang/tools/tree/master/gopls

---

## Configuration

All settings are available under the `codelensGolangNavigate` namespace.

| Option                                         | Description                                         | Default |
| ---------------------------------------------- | --------------------------------------------------- | ------- |
| `codelensGolangNavigate.enableCodeLensActions` | Enable or disable CodeLens actions                  | true    |
| `codelensGolangNavigate.enableHoverLinks`      | Enable or disable hover navigation links            | true    |
| `codelensGolangNavigate.refreshOnTyping`       | Refresh CodeLens while typing in the active Go file | true    |
| `codelensGolangNavigate.refreshDebounceMs`     | Debounce delay (ms) for refresh-on-typing           | 120     |
| `codelensGolangNavigate.logLevel`              | Minimum log level: error, warn, info, debug         | info    |

### Example settings

Add the following to your Visual Studio Code `settings.json`:

```json
{
  "codelensGolangNavigate.enableCodeLensActions": true,
  "codelensGolangNavigate.enableHoverLinks": true,
  "codelensGolangNavigate.refreshOnTyping": true,
  "codelensGolangNavigate.refreshDebounceMs": 100,
  "codelensGolangNavigate.logLevel": "info"
}
```
