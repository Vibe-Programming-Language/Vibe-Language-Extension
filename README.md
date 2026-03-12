<p align="center">
  <img src="https://raw.githubusercontent.com/Vibe-Programming-Language/Vibe/main/assets/banner.svg" alt="Vibe" width="400">
</p>

<h1 align="center">Vibe Language Extension for VS Code</h1>

<p align="center">
  <strong>The official VS Code extension for the <a href="https://github.com/Vibe-Programming-Language/Vibe">Vibe programming language</a></strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=CodePlanet.vibe-lang-support"><img src="https://img.shields.io/visual-studio-marketplace/v/CodePlanet.vibe-lang-support?color=%234cc9f0&label=Marketplace" alt="Version"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=CodePlanet.vibe-lang-support"><img src="https://img.shields.io/visual-studio-marketplace/i/CodePlanet.vibe-lang-support?color=%2300b4d8" alt="Installs"></a>
  <a href="https://github.com/Vibe-Programming-Language/Vibe-Language-Extension/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://github.com/Vibe-Programming-Language/Vibe"><img src="https://img.shields.io/badge/Vibe-v1.0.0-black?style=flat-square" alt="Vibe"></a>
  <a href="https://vibe-lang-docs.vercel.app"><img src="https://img.shields.io/badge/docs-live-black?style=flat-square" alt="Docs"></a>
</p>

---

## Features

### Syntax Highlighting
Rich TextMate grammar covering all Vibe keywords, operators, builtins, strings, comments, and more.

```vibe
fn fibonacci(n) {
    if n <= 1 { return n; }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

for i in range(0, 10) {
    print(fibonacci(i));
}
```

### IntelliSense & Completions
- **50+ builtin functions** with signatures and documentation on hover
- **Keyword completions** with usage examples
- **Module completions** — type `math.` and see all available methods
- **Method completions** for strings, lists, and maps

### 40+ Code Snippets
Rapidly scaffold common patterns:

| Prefix | Description |
|--------|-------------|
| `fn` | Function declaration |
| `class` | Class with constructor |
| `match` | Pattern matching block |
| `forin` | For-in loop |
| `ife` | If-else statement |
| `try` | Try-catch-finally |
| `import` | Import statement |
| `arrow` | Arrow function |
| ... | And 30+ more! |

Type the prefix and press `Tab` to expand.

### Run, Build & Check
| Command | Keybinding | Description |
|---------|------------|-------------|
| **Vibe: Run File** | `Ctrl+Shift+R` | Execute the current `.vibe` file |
| **Vibe: Build File** | `Ctrl+Shift+B` | Transpile to C++ |
| **Vibe: Check File** | — | Run diagnostics on the file |
| **Vibe: Open REPL** | `Ctrl+Shift+I` | Launch interactive Vibe REPL |
| **Vibe: Run Selection in REPL** | — | Send selected code to the REPL |

All commands are also available via the editor context menu (right-click) and the title bar buttons.

### Diagnostics
Errors are automatically detected on save and displayed in VS Code's **Problems** panel with line-level precision. Powered by `vibe check`.

### Hover Documentation
Hover over any builtin function, keyword, or module method to see inline documentation with signatures and descriptions.

### Status Bar
A **⚡ Vibe** indicator appears in the status bar when editing `.vibe` files. Click it to run the current file.

### File Icons
Custom file icon for `.vibe` files in the explorer.

---

## Installation

### From the VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for **"Vibe Language Support"**
4. Click **Install**

### From VSIX File
Download the latest `.vsix` from [Releases](https://github.com/Vibe-Programming-Language/Vibe-Language-Extension/releases), then:

1. Open VS Code
2. Go to Extensions → `...` → **Install from VSIX...**
3. Select the downloaded `.vsix` file

### From Source
```bash
git clone https://github.com/Vibe-Programming-Language/Vibe-Language-Extension.git
cd Vibe-Language-Extension
npm install
npx vsce package
# Then install the generated .vsix in VS Code
```

---

## Requirements

- **VS Code** 1.86.0 or later
- **Vibe CLI** installed and available in your `PATH` ([Install Vibe](https://github.com/Vibe-Programming-Language/Vibe#installation))

---

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `vibe.executablePath` | `"vibe"` | Path to the Vibe executable |
| `vibe.enableDiagnostics` | `true` | Enable error checking on save |
| `vibe.showStatusBar` | `true` | Show Vibe status bar indicator |

---

## Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Ctrl+Shift+R` (`Cmd+Shift+R` on mac) | Run current file |
| `Ctrl+Shift+B` (`Cmd+Shift+B` on mac) | Build (transpile to C++) |
| `Ctrl+Shift+I` (`Cmd+Shift+I` on mac) | Open REPL |

---

## Supported Language Features

- ✅ Syntax highlighting (keywords, types, builtins, strings, comments, operators)
- ✅ IntelliSense with 50+ builtin function completions
- ✅ Hover documentation for builtins, keywords, and modules
- ✅ Module-aware completions (`math.`, `io.`, `os.`, `time.`, `json.`)
- ✅ Method completions for `.` on strings, lists, and maps
- ✅ 40+ code snippets
- ✅ Bracket matching and auto-closing
- ✅ Code folding
- ✅ Comment toggling (`Ctrl+/`)
- ✅ Indentation rules
- ✅ On-save diagnostics
- ✅ Run/Build/Check commands with keybindings
- ✅ Interactive REPL with selection support
- ✅ Custom file icon

---

## About Vibe

**Vibe** is a modern, expressive programming language that compiles to C++ and includes a tree-walking interpreter for rapid prototyping. It features:
- Clean, intuitive syntax
- First-class functions & closures
- Classes with inheritance
- Pattern matching
- Rich standard library (50+ builtins, 7 modules)
- Error handling with try/catch
- REPL for interactive development

Learn more at [github.com/Vibe-Programming-Language/Vibe](https://github.com/Vibe-Programming-Language/Vibe)

📖 **Documentation:** [vibe-lang-docs.vercel.app](https://vibe-lang-docs.vercel.app)

---

## Contributing

Contributions are welcome! Please open an issue or pull request on [GitHub](https://github.com/Vibe-Programming-Language/Vibe-Language-Extension).

---

## License

[MIT](LICENSE) © CodePlanet


