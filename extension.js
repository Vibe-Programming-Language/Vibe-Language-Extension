const vscode = require("vscode");
const { exec } = require("child_process");
const path = require("path");

// ── Globals ───────────────────────────────────────
let diagnosticCollection;
let statusBarItem;
let outputChannel;
let replTerminal = null;

// ── Vibe executable path ──────────────────────────
function vibeExe() {
  return vscode.workspace.getConfiguration("vibe").get("executablePath", "vibe");
}

// ── Helper: get/create terminal ───────────────────
function getTerminal(name) {
  let t = vscode.window.terminals.find((t) => t.name === name);
  if (!t) t = vscode.window.createTerminal({ name });
  return t;
}

// ── Helper: validate .vibe file ───────────────────
function requireVibeFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor.");
    return null;
  }
  if (!editor.document.fileName.endsWith(".vibe")) {
    vscode.window.showErrorMessage("Not a .vibe file.");
    return null;
  }
  return editor;
}

// ── Diagnostics ───────────────────────────────────
function runDiagnostics(document) {
  if (!vscode.workspace.getConfiguration("vibe").get("enableDiagnostics", true)) return;
  if (!document.fileName.endsWith(".vibe")) return;

  const exe = vibeExe();
  exec(`${exe} check "${document.fileName}" 2>&1`, { timeout: 10000 }, (err, stdout, stderr) => {
    diagnosticCollection.delete(document.uri);
    const output = (stdout || "") + (stderr || "");
    if (!output.trim()) return;

    const diagnostics = [];
    // Parse error patterns like: [line N] Error: message  /  Error at line N: message
    const patterns = [
      /\[line\s+(\d+)\]\s*(Error|Warning):\s*(.+)/gi,
      /(?:Error|Parse error|Runtime error)\s+at\s+line\s+(\d+)(?::\d+)?:\s*(.+)/gi,
      /line\s+(\d+).*?:\s*(.*error.*)/gi,
    ];

    for (const pattern of patterns) {
      let m;
      while ((m = pattern.exec(output)) !== null) {
        const line = Math.max(0, parseInt(m[1], 10) - 1);
        const msg = m[m.length - 1].trim();
        const severity = /warning/i.test(m[0])
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Error;
        const range = new vscode.Range(line, 0, line, 1000);
        diagnostics.push(new vscode.Diagnostic(range, msg, severity));
      }
    }

    // If there's error output but no parsed lines, show first line as error
    if (diagnostics.length === 0 && /error/i.test(output)) {
      const firstLine = output.split("\n").find((l) => l.trim()) || output;
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1000),
          firstLine.trim(),
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    diagnosticCollection.set(document.uri, diagnostics);
  });
}

// ── Hover Provider ────────────────────────────────
const BUILTIN_DOCS = {
  print: { sig: "print(...args)", desc: "Print values followed by a newline." },
  println: { sig: "println()", desc: "Print an empty newline." },
  write: { sig: "write(...args)", desc: "Print values without trailing newline." },
  input: { sig: "input(prompt?: str) -> str", desc: "Read a line of input from the user." },
  len: { sig: "len(val) -> int", desc: "Return the length of a string, list, or map." },
  str: { sig: "str(val) -> str", desc: "Convert a value to its string representation." },
  int: { sig: "int(val) -> int", desc: "Convert a value to an integer." },
  float: { sig: "float(val) -> float", desc: "Convert a value to a float." },
  type: { sig: "type(val) -> str", desc: "Return the type name of a value." },
  typeof: { sig: "typeof(val) -> str", desc: "Alias for type(). Return type name." },
  range: { sig: "range(start, end, step?) -> range", desc: "Create a numeric range from start to end." },
  abs: { sig: "abs(n) -> number", desc: "Return the absolute value." },
  min: { sig: "min(a, b) / min(list) -> value", desc: "Return the minimum value." },
  max: { sig: "max(a, b) / max(list) -> value", desc: "Return the maximum value." },
  sum: { sig: "sum(list) -> number", desc: "Return the sum of all elements in a list." },
  sorted: { sig: "sorted(list) -> list", desc: "Return a sorted copy of the list." },
  reversed: { sig: "reversed(val) -> list|str", desc: "Return a reversed copy." },
  flatten: { sig: "flatten(list) -> list", desc: "Flatten nested lists one level." },
  unique: { sig: "unique(list) -> list", desc: "Return list with duplicates removed." },
  zip: { sig: "zip(a, b) -> list", desc: "Zip two lists into pairs." },
  enumerate: { sig: "enumerate(list) -> list", desc: "Return list of [index, value] pairs." },
  keys: { sig: "keys(map) -> list", desc: "Get all keys from a map." },
  values: { sig: "values(map) -> list", desc: "Get all values from a map." },
  join: { sig: "join(list, sep) -> str", desc: "Join list elements into a string." },
  reduce: { sig: "reduce(list, fn, init?) -> value", desc: "Reduce list to a single value." },
  map: { sig: "map(list, fn) -> list", desc: "Transform each element of a list." },
  filter: { sig: "filter(list, fn) -> list", desc: "Keep elements matching predicate." },
  chr: { sig: "chr(code: int) -> str", desc: "Return character from ASCII code." },
  ord: { sig: "ord(char: str) -> int", desc: "Return ASCII code of character." },
  format: { sig: "format(fmt, ...args) -> str", desc: "Format string with {} placeholders." },
  assert: { sig: "assert(cond, msg?)", desc: "Assert condition is truthy, throw if not." },
  clock: { sig: "clock() -> float", desc: "Current time in seconds (high-resolution)." },
  timestamp: { sig: "timestamp() -> int", desc: "Unix timestamp in seconds." },
  random: { sig: "random() / random(n) -> number", desc: "Random float [0,1) or int [0,n)." },
  hash: { sig: "hash(val) -> int", desc: "Compute hash value of any value." },
  toJSON: { sig: "toJSON(val) -> str", desc: "Convert value to JSON string." },
  list: { sig: "list(val) -> list", desc: "Convert value to a list." },
  repeat: { sig: "repeat(str, n) -> str", desc: "Repeat a string n times." },
  exit: { sig: "exit(code?: int)", desc: "Exit the program with optional code." },
  isNull: { sig: "isNull(val) -> bool", desc: "Check if value is null." },
  isInt: { sig: "isInt(val) -> bool", desc: "Check if value is an integer." },
  isFloat: { sig: "isFloat(val) -> bool", desc: "Check if value is a float." },
  isStr: { sig: "isStr(val) -> bool", desc: "Check if value is a string." },
  isBool: { sig: "isBool(val) -> bool", desc: "Check if value is a boolean." },
  isList: { sig: "isList(val) -> bool", desc: "Check if value is a list." },
  isMap: { sig: "isMap(val) -> bool", desc: "Check if value is a map." },
  isFunction: { sig: "isFunction(val) -> bool", desc: "Check if value is a function." },
};

const KEYWORD_DOCS = {
  var: "Declare a mutable variable.\n```vibe\nvar name = \"Alice\";\n```",
  let: "Declare a mutable variable (alias for var).\n```vibe\nlet count = 42;\n```",
  const: "Declare an immutable constant.\n```vibe\nconst PI = 3.14159;\n```",
  fn: "Declare a function.\n```vibe\nfn add(a, b) {\n  return a + b;\n}\n```",
  class: "Declare a class.\n```vibe\nclass Animal {\n  init(name) { self.name = name; }\n}\n```",
  interface: "Declare an interface.\n```vibe\ninterface Printable {\n  fn toString() -> str;\n}\n```",
  enum: "Declare an enum.\n```vibe\nenum Color { Red, Green, Blue }\n```",
  match: "Pattern matching expression.\n```vibe\nmatch value {\n  1 => print(\"one\"),\n  _ => print(\"other\"),\n}\n```",
  import: "Import a module.\n```vibe\nimport math;\nimport io;\n```",
  export: "Export a declaration for use in other files.\n```vibe\nexport fn helper() { ... }\n```",
  for: "Loop over a range or collection.\n```vibe\nfor i in range(0, 10) { ... }\nfor item in list { ... }\n```",
  while: "Loop while condition is true.\n```vibe\nwhile x < 10 { x = x + 1; }\n```",
  try: "Error handling block.\n```vibe\ntry { ... } catch e { ... } finally { ... }\n```",
  throw: "Throw an error.\n```vibe\nthrow \"Something went wrong!\";\n```",
  self: "Reference to the current object instance within a class method.",
  super: "Reference to the parent class, typically used in constructors.\n```vibe\nsuper(args);\n```",
};

const MODULE_DOCS = {
  "math.sqrt": "math.sqrt(x) — Square root",
  "math.pow": "math.pow(base, exp) — Power",
  "math.sin": "math.sin(x) — Sine",
  "math.cos": "math.cos(x) — Cosine",
  "math.tan": "math.tan(x) — Tangent",
  "math.log": "math.log(x, base?) — Logarithm",
  "math.floor": "math.floor(x) — Round down",
  "math.ceil": "math.ceil(x) — Round up",
  "math.round": "math.round(x) — Round to nearest",
  "math.random": "math.random() — Random float [0, 1)",
  "math.randomInt": "math.randomInt(lo, hi) — Random integer [lo, hi]",
  "math.factorial": "math.factorial(n) — Factorial n!",
  "math.isPrime": "math.isPrime(n) — Primality test",
  "math.gcd": "math.gcd(a, b) — Greatest common divisor",
  "math.lcm": "math.lcm(a, b) — Least common multiple",
  "math.PI": "math.PI — 3.14159265358979...",
  "math.E": "math.E — 2.71828182845904...",
  "io.readFile": "io.readFile(path) — Read entire file as string",
  "io.writeFile": "io.writeFile(path, data) — Write string to file",
  "io.appendFile": "io.appendFile(path, data) — Append string to file",
  "io.readLines": "io.readLines(path) — Read file as list of lines",
  "io.exists": "io.exists(path) — Check if file exists",
  "os.exec": "os.exec(cmd) — Execute shell command",
  "os.env": "os.env(name) — Get environment variable",
  "os.platform": "os.platform() — Get OS name",
  "os.cwd": "os.cwd() — Current working directory",
  "os.sleep": "os.sleep(ms) — Sleep for milliseconds",
  "time.now": "time.now() — Current time string",
  "time.millis": "time.millis() — Millisecond timestamp",
  "time.sleep": "time.sleep(ms) — Sleep for ms",
  "time.measure": "time.measure(fn) — Measure execution time",
  "json.stringify": "json.stringify(val) — Convert to JSON string",
};

function createHoverProvider() {
  return vscode.languages.registerHoverProvider("vibe", {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position, /[a-zA-Z_][a-zA-Z0-9_]*/);
      if (!range) return null;
      const word = document.getText(range);

      // Check builtin functions
      if (BUILTIN_DOCS[word]) {
        const doc = BUILTIN_DOCS[word];
        const md = new vscode.MarkdownString();
        md.appendCodeblock(doc.sig, "vibe");
        md.appendMarkdown("\n" + doc.desc);
        return new vscode.Hover(md, range);
      }

      // Check keywords
      if (KEYWORD_DOCS[word]) {
        const md = new vscode.MarkdownString();
        md.appendMarkdown(KEYWORD_DOCS[word]);
        return new vscode.Hover(md, range);
      }

      // Check module.function patterns
      const lineText = document.lineAt(position.line).text;
      const dotMatch = lineText.match(new RegExp(`(\\w+)\\.${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
      if (dotMatch) {
        const fullName = dotMatch[1] + "." + word;
        if (MODULE_DOCS[fullName]) {
          const md = new vscode.MarkdownString();
          md.appendMarkdown("**" + fullName + "**\n\n" + MODULE_DOCS[fullName]);
          return new vscode.Hover(md, range);
        }
      }

      return null;
    },
  });
}

// ── Completion Provider ───────────────────────────
function createCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    "vibe",
    {
      provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        const items = [];

        // Module completions (after "math.", "io.", "os.", etc.)
        const modulePrefixMatch = linePrefix.match(/\b(math|io|os|time|json|string|collections)\.\s*$/);
        if (modulePrefixMatch) {
          const mod = modulePrefixMatch[1];
          for (const [key, desc] of Object.entries(MODULE_DOCS)) {
            if (key.startsWith(mod + ".")) {
              const funcName = key.split(".")[1];
              const item = new vscode.CompletionItem(funcName, vscode.CompletionItemKind.Function);
              item.detail = desc;
              item.insertText = new vscode.SnippetString(
                /\(.*\)/.test(desc) ? funcName + "(${1})" : funcName
              );
              items.push(item);
            }
          }
          return items;
        }

        // Method completions (after "." on strings/lists)
        if (linePrefix.match(/\.\s*$/)) {
          const stringMethods = [
            "upper()", "lower()", "trim()", "trimStart()", "trimEnd()",
            "split(delimiter)", "contains(sub)", "startsWith(prefix)", "endsWith(suffix)",
            "replace(old, new)", "slice(from, to)", "indexOf(sub)", "repeat(n)",
            "reverse()", "charAt(index)", "chars()", "padStart(len, pad)",
            "padEnd(len, pad)", "count(sub)", "isDigit()", "isAlpha()",
            "toInt()", "toFloat()", "length", "isEmpty",
          ];
          const listMethods = [
            "push(val)", "pop()", "add(val)", "insert(index, val)", "remove(index)",
            "sort()", "reverse()", "clear()", "contains(val)", "indexOf(val)",
            "count(val)", "first()", "last()", "slice(from, to)", "join(sep)",
            "map(fn)", "filter(fn)", "reduce(fn, init)", "forEach(fn)",
            "find(fn)", "findIndex(fn)", "some(fn)", "every(fn)", "flat()",
            "length", "isEmpty",
          ];
          const mapMethods = [
            "get(key, default)", "set(key, val)", "has(key)", "delete(key)",
            "keys()", "values()", "length",
          ];

          const allMethods = [...new Set([...stringMethods, ...listMethods, ...mapMethods])];
          for (const method of allMethods) {
            const name = method.replace(/\(.*\)$/, "");
            const hasParens = method.includes("(");
            const item = new vscode.CompletionItem(name, hasParens ? vscode.CompletionItemKind.Method : vscode.CompletionItemKind.Property);
            item.detail = method;
            if (hasParens) {
              const params = method.match(/\(([^)]*)\)/)?.[1] || "";
              item.insertText = new vscode.SnippetString(
                params ? name + "(${1})" : name + "()"
              );
            }
            items.push(item);
          }
          return items;
        }

        // Builtin function completions
        for (const [name, doc] of Object.entries(BUILTIN_DOCS)) {
          const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
          item.detail = doc.sig;
          item.documentation = new vscode.MarkdownString(doc.desc);
          item.insertText = new vscode.SnippetString(name + "(${1})");
          items.push(item);
        }

        // Keyword completions
        const keywords = [
          "var", "let", "const", "fn", "class", "interface", "enum",
          "if", "else", "for", "in", "while", "do", "match", "return",
          "break", "continue", "throw", "try", "catch", "finally",
          "import", "export", "extends", "implements", "override",
          "self", "super", "init", "true", "false", "null",
          "static", "private", "public", "protected", "async", "await",
        ];
        for (const kw of keywords) {
          const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
          if (KEYWORD_DOCS[kw]) {
            item.documentation = new vscode.MarkdownString(KEYWORD_DOCS[kw]);
          }
          items.push(item);
        }

        // Module name completions
        const modules = ["math", "io", "os", "time", "json", "string", "collections"];
        for (const mod of modules) {
          const item = new vscode.CompletionItem(mod, vscode.CompletionItemKind.Module);
          item.detail = `import ${mod};`;
          items.push(item);
        }

        return items;
      },
    },
    ".",  // trigger on dot
    ""    // trigger on any character
  );
}

// ── Status Bar ────────────────────────────────────
function createStatusBar(context) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(zap) Vibe";
  statusBarItem.tooltip = "Vibe Language — Click to run";
  statusBarItem.command = "vibe.runFile";
  context.subscriptions.push(statusBarItem);

  function updateStatusBar() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.fileName.endsWith(".vibe")) {
      if (vscode.workspace.getConfiguration("vibe").get("showStatusBar", true)) {
        statusBarItem.show();
      }
    } else {
      statusBarItem.hide();
    }
  }

  updateStatusBar();
  vscode.window.onDidChangeActiveTextEditor(updateStatusBar, null, context.subscriptions);
}

// ── Activate ──────────────────────────────────────
function activate(context) {
  outputChannel = vscode.window.createOutputChannel("Vibe");
  diagnosticCollection = vscode.languages.createDiagnosticCollection("vibe");
  context.subscriptions.push(diagnosticCollection, outputChannel);

  // ── Run File ──────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("vibe.runFile", async () => {
      const editor = requireVibeFile();
      if (!editor) return;
      await editor.document.save();
      const terminal = getTerminal("Vibe");
      terminal.show(true);
      terminal.sendText(`${vibeExe()} "${editor.document.fileName}"`);
    })
  );

  // ── Build File ────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("vibe.buildFile", async () => {
      const editor = requireVibeFile();
      if (!editor) return;
      await editor.document.save();
      const terminal = getTerminal("Vibe Build");
      terminal.show(true);
      terminal.sendText(`${vibeExe()} build "${editor.document.fileName}"`);
    })
  );

  // ── Check File ────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("vibe.checkFile", async () => {
      const editor = requireVibeFile();
      if (!editor) return;
      await editor.document.save();
      runDiagnostics(editor.document);
      vscode.window.showInformationMessage("Vibe: Checking file...");
    })
  );

  // ── Open REPL ─────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("vibe.openRepl", async () => {
      if (replTerminal && replTerminal.exitStatus === undefined) {
        replTerminal.show(true);
      } else {
        replTerminal = vscode.window.createTerminal({ name: "Vibe REPL" });
        replTerminal.show(true);
        replTerminal.sendText(`${vibeExe()} repl`);
      }
    })
  );

  // ── Run Selection in REPL ─────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("vibe.runSelection", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode.window.showWarningMessage("No text selected.");
        return;
      }
      if (!replTerminal || replTerminal.exitStatus !== undefined) {
        replTerminal = vscode.window.createTerminal({ name: "Vibe REPL" });
        replTerminal.sendText(`${vibeExe()} repl`);
        // Brief delay for REPL to start
        await new Promise((r) => setTimeout(r, 500));
      }
      replTerminal.show(true);
      // Send each line separately to the REPL
      for (const line of selection.split("\n")) {
        if (line.trim()) replTerminal.sendText(line);
      }
    })
  );

  // ── Diagnostics on save ───────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.fileName.endsWith(".vibe")) {
        runDiagnostics(doc);
      }
    })
  );

  // ── Clear diagnostics on close ────────────────
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticCollection.delete(doc.uri);
    })
  );

  // ── Hover Provider ────────────────────────────
  context.subscriptions.push(createHoverProvider());

  // ── Completion Provider ───────────────────────
  context.subscriptions.push(createCompletionProvider());

  // ── Status Bar ────────────────────────────────
  createStatusBar(context);

  // ── Run diagnostics on already-open files ─────
  if (vscode.window.activeTextEditor) {
    const doc = vscode.window.activeTextEditor.document;
    if (doc.fileName.endsWith(".vibe")) {
      runDiagnostics(doc);
    }
  }

  outputChannel.appendLine("Vibe Language Support activated.");
}

function deactivate() {
  if (diagnosticCollection) diagnosticCollection.dispose();
  if (outputChannel) outputChannel.dispose();
}

module.exports = { activate, deactivate };

