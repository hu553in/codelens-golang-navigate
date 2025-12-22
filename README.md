# codelens-golang-navigate

[![CI](https://github.com/hu553in/codelens-golang-navigate/actions/workflows/ci.yml/badge.svg)](https://github.com/hu553in/codelens-golang-navigate/actions/workflows/ci.yml)
[![Open VSX Version](https://img.shields.io/open-vsx/v/hu553in/codelens-golang-navigate)](https://open-vsx.org/extension/hu553in/codelens-golang-navigate)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/hu553in.codelens-golang-navigate)](marketplace.visualstudio.com/items?itemName=hu553in.codelens-golang-navigate)

- [License](./LICENSE)
- [How to contribute](./CONTRIBUTING.md)
- [Code of conduct](./CODE_OF_CONDUCT.md)

A Visual Studio Code extension that adds **CodeLens actions** and **trusted hover links** for fast navigation in Golang code.

---

## Features

### CodeLens navigation

For Go symbols, the extension shows CodeLens actions:

- **Def**
- **Type**
- **Impl**
- **Refs**

CodeLens is:

- Automatically refreshed while typing (debounced)
- Powered by `gopls` via VS Code's symbol provider

### Hover navigation

When hovering a Go symbol, you get clickable links:

```
Def · Type · Impl · Refs
```

These links are trusted and execute the corresponding editor navigation commands.

### Performance-focused

- Document symbols are cached per file version
- CodeLens refresh is debounced (configurable)
- Refresh happens **only for the active Go editor**

---

## Prerequisites

- [Go installed](https://go.dev/doc/install)
- [Go VS Code extension](https://marketplace.visualstudio.com/items?itemName=golang.go)
- [`gopls` language server](https://github.com/golang/tools/tree/master/gopls)

---

## Configuration

All settings are under the `codelensGolangNavigate` namespace.

| Option                                         | Description                                          | Default |
| ---------------------------------------------- | ---------------------------------------------------- | ------- |
| `codelensGolangNavigate.enableCodeLensActions` | Enable/disable CodeLens actions                      | `true`  |
| `codelensGolangNavigate.enableHoverLinks`      | Enable/disable hover links                           | `true`  |
| `codelensGolangNavigate.refreshOnTyping`       | Refresh CodeLens when typing in the active Go file   | `true`  |
| `codelensGolangNavigate.refreshDebounceMs`     | Debounce delay (ms) for refresh-on-typing            | `120`   |
| `codelensGolangNavigate.logLevel`              | Minimum log level (`error`, `warn`, `info`, `debug`) | `info`  |

### Example `settings.json`

```json
{
  "codelensGolangNavigate.enableCodeLensActions": true,
  "codelensGolangNavigate.enableHoverLinks": true,
  "codelensGolangNavigate.refreshOnTyping": true,
  "codelensGolangNavigate.refreshDebounceMs": 100,
  "codelensGolangNavigate.logLevel": "info"
}
```
