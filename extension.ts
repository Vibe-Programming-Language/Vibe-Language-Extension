import * as vscode from 'vscode';
import { exec } from 'child_process';

const MODULES = [
  'dsa', 'neural', 'ai', 'data', 'viz', 'image', 'web', 'db', 'crypto', 'fs', 'async', 'test', 'math', 'audio', 'cloud', 'game', 'web3', 'iot', 'robot', 'quantum'
];

const KEYWORDS = [
  'let', 'const', 'fn', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'match', 'case', 'class', 'interface', 'enum', 'import', 'show', 'try', 'catch', 'finally'
];

const DOCS: Record<string, string> = {
  show: '**show** - Print values to console.\n\n```vibe\nshow "Hello"\nshow value\n```',
  dsa: '**dsa** - Data Structures and Algorithms module.\n\n```vibe\nimport dsa\nlet stack = dsa.Stack()\n```',
  neural: '**neural** - Deep learning module with tensors, layers, and optimizers.',
  ai: '**ai** - Classical machine learning, NLP, CV, RL, and metrics.',
  data: '**data** - DataFrame and analytics utilities.',
  web: '**web** - HTTP server/client and API framework.',
  async: '**async** - Concurrency primitives and task combinators.',
  test: '**test** - Test runner and assertion framework.'
};

function vibeExe(): string {
  return vscode.workspace.getConfiguration('vibe').get<string>('executablePath', 'vibe');
}

function activeVibeEditor(): vscode.TextEditor | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'vibe') {
    return null;
  }
  return editor;
}

function runCommand(cmd: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error((stderr || stdout || err.message).trim()));
        return;
      }
      resolve((stdout || stderr || '').trim());
    });
  });
}

function formatVibeText(text: string, tabSize: number): string {
  const lines = text.split(/\r?\n/);
  let indent = 0;
  return lines.map((line) => {
    const t = line.trim();
    if (!t) return '';
    if (/^[}\])]/.test(t)) indent = Math.max(indent - 1, 0);
    const out = ' '.repeat(indent * tabSize) + t;
    if (/[{[(]$/.test(t)) indent += 1;
    return out;
  }).join('\n');
}

function parseSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
  const symbols: vscode.DocumentSymbol[] = [];
  const text = document.getText();
  const lines = text.split(/\r?\n/);

  const pushSymbol = (name: string, kind: vscode.SymbolKind, line: number, endLine: number) => {
    const range = new vscode.Range(line, 0, endLine, lines[endLine]?.length ?? 0);
    const selectionRange = new vscode.Range(line, 0, line, name.length);
    symbols.push(new vscode.DocumentSymbol(name, '', kind, range, selectionRange));
  };

  lines.forEach((line, idx) => {
    const fnMatch = line.match(/^\s*(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (fnMatch) pushSymbol(fnMatch[1], vscode.SymbolKind.Function, idx, idx);

    const classMatch = line.match(/^\s*class\s+([A-Z][a-zA-Z0-9_]*)\b/);
    if (classMatch) pushSymbol(classMatch[1], vscode.SymbolKind.Class, idx, idx);

    const interfaceMatch = line.match(/^\s*interface\s+([A-Z][a-zA-Z0-9_]*)\b/);
    if (interfaceMatch) pushSymbol(interfaceMatch[1], vscode.SymbolKind.Interface, idx, idx);

    const enumMatch = line.match(/^\s*enum\s+([A-Z][a-zA-Z0-9_]*)\b/);
    if (enumMatch) pushSymbol(enumMatch[1], vscode.SymbolKind.Enum, idx, idx);

    const varMatch = line.match(/^\s*(let|const)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/);
    if (varMatch) pushSymbol(varMatch[2], vscode.SymbolKind.Variable, idx, idx);
  });

  return symbols;
}

export function activate(context: vscode.ExtensionContext) {
  const diagnostics = vscode.languages.createDiagnosticCollection('vibe');
  context.subscriptions.push(diagnostics);

  const runCurrent = vscode.commands.registerCommand('vibe.run', () => {
    const editor = activeVibeEditor();
    if (!editor) {
      vscode.window.showErrorMessage('Open a .vibe file first.');
      return;
    }
    const terminal = vscode.window.createTerminal('Vibe');
    terminal.sendText(`${vibeExe()} run "${editor.document.fileName}"`);
    terminal.show();
  });

  const runFile = vscode.commands.registerCommand('vibe.runFile', () => vscode.commands.executeCommand('vibe.run'));

  const buildFile = vscode.commands.registerCommand('vibe.buildFile', () => {
    const editor = activeVibeEditor();
    if (!editor) return;
    const terminal = vscode.window.createTerminal('Vibe Build');
    terminal.sendText(`${vibeExe()} build "${editor.document.fileName}"`);
    terminal.show();
  });

  const checkFile = vscode.commands.registerCommand('vibe.checkFile', async () => {
    const editor = activeVibeEditor();
    if (!editor) return;
    try {
      const out = await runCommand(`${vibeExe()} check "${editor.document.fileName}"`);
      vscode.window.showInformationMessage(out || 'No issues found.');
    } catch (err: any) {
      vscode.window.showErrorMessage(err.message);
    }
  });

  const runTests = vscode.commands.registerCommand('vibe.runTests', () => {
    const terminal = vscode.window.createTerminal('Vibe Tests');
    terminal.sendText(`${vibeExe()} test`);
    terminal.show();
  });

  const openDocs = vscode.commands.registerCommand('vibe.openDocs', () => {
    vscode.env.openExternal(vscode.Uri.parse('https://vibe-lang-docs.vercel.app'));
  });

  const newProject = vscode.commands.registerCommand('vibe.newProject', async () => {
    const folder = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false });
    if (!folder?.length) return;
    const terminal = vscode.window.createTerminal('Vibe New Project');
    terminal.sendText(`${vibeExe()} init "${folder[0].fsPath}"`);
    terminal.show();
  });

  const insertSnippet = vscode.commands.registerCommand('vibe.insertSnippet', async () => {
    const editor = activeVibeEditor();
    if (!editor) return;
    const pick = await vscode.window.showQuickPick(['Function', 'Class', 'Async Function', 'Match']);
    if (!pick) return;
    const map: Record<string, string> = {
      'Function': 'fn name(params) {\n    // body\n}',
      'Class': 'class Name {\n    fn init() {\n    }\n}',
      'Async Function': 'async fn name(params) {\n    // body\n}',
      'Match': 'match value {\n    case _ => show "default"\n}'
    };
    editor.insertSnippet(new vscode.SnippetString(map[pick]));
  });

  const runSelection = vscode.commands.registerCommand('vibe.runSelection', () => {
    const editor = activeVibeEditor();
    if (!editor) return;
    const txt = editor.document.getText(editor.selection);
    const terminal = vscode.window.createTerminal('Vibe REPL');
    terminal.show();
    terminal.sendText(`${vibeExe()} repl`);
    if (txt.trim()) terminal.sendText(txt);
  });

  const openRepl = vscode.commands.registerCommand('vibe.openRepl', () => {
    const terminal = vscode.window.createTerminal('Vibe REPL (AI Mode)');
    terminal.sendText(`${vibeExe()} repl --multiline`); // Assume --multiline flag enables robust shell 
    terminal.show();
  });

  const debugAI = vscode.commands.registerCommand('vibe.debugAI', () => {
    const terminal = vscode.window.createTerminal('Vibe AI Debug');
    terminal.sendText(`${vibeExe()} run --trace-tensors ${activeVibeEditor()?.document.uri.fsPath}`);
    terminal.show();
  });

  const formatCmd = vscode.commands.registerCommand('vibe.formatDocument', async () => {
    const editor = activeVibeEditor();
    if (!editor) return;
    const tabSize = vscode.workspace.getConfiguration('vibe').get<number>('tabSize', 4);
    const formatted = formatVibeText(editor.document.getText(), tabSize);
    await editor.edit((eb) => {
      const full = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
      eb.replace(full, formatted);
    });
  });

  const fmtProvider = vscode.languages.registerDocumentFormattingEditProvider('vibe', {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      const tabSize = vscode.workspace.getConfiguration('vibe').get<number>('tabSize', 4);
      const formatted = formatVibeText(document.getText(), tabSize);
      const full = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
      return [vscode.TextEdit.replace(full, formatted)];
    }
  });

  const hover = vscode.languages.registerHoverProvider('vibe', {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position);
      if (!range) return;
      const word = document.getText(range);
      const docs = DOCS[word];
      if (!docs) return;
      return new vscode.Hover(new vscode.MarkdownString(docs));
    }
  });

  const completion = vscode.languages.registerCompletionItemProvider('vibe', {
    provideCompletionItems() {
      const items: vscode.CompletionItem[] = [];

      MODULES.forEach((mod) => {
        const item = new vscode.CompletionItem(mod, vscode.CompletionItemKind.Module);
        item.detail = `Vibe ${mod} module`;
        item.insertText = mod;
        items.push(item);
      });

      KEYWORDS.forEach((kw) => {
        const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
        items.push(item);
      });

      const apiExamples: Array<[string, string]> = [
        ['dsa.quickSort', 'dsa.quickSort(${1:array})'],
        ['neural.Sequential', 'neural.Sequential([${1:layers}])'],
        ['ai.RandomForest', 'ai.RandomForest(nEstimators: ${1:100})'],
        ['data.readCSV', 'data.readCSV("${1:file.csv}")'],
        ['web.Server', 'web.Server(${1:3000})']
      ];

      apiExamples.forEach(([name, snippet]) => {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
        item.insertText = new vscode.SnippetString(snippet);
        item.detail = 'Vibe API';
        items.push(item);
      });

      return items;
    }
  }, '.', ':');

  const signature = vscode.languages.registerSignatureHelpProvider('vibe', {
    provideSignatureHelp(document, position) {
      const line = document.lineAt(position.line).text.slice(0, position.character);
      const fnMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_.]*)\([^()]*$/);
      if (!fnMatch) return null;

      const sig = new vscode.SignatureInformation(`${fnMatch[1]}(arg1, arg2, ...)`);
      sig.documentation = new vscode.MarkdownString('Vibe function call');
      sig.parameters = [
        new vscode.ParameterInformation('arg1', 'First argument'),
        new vscode.ParameterInformation('arg2', 'Second argument')
      ];

      const help = new vscode.SignatureHelp();
      help.signatures = [sig];
      help.activeSignature = 0;
      help.activeParameter = 0;
      return help;
    }
  }, '(', ',');

  const definition = vscode.languages.registerDefinitionProvider('vibe', {
    provideDefinition(document, position) {
      const range = document.getWordRangeAtPosition(position);
      if (!range) return null;
      const word = document.getText(range);
      const re = new RegExp(`^\\s*(?:fn|class|interface|enum|let|const)\\s+${word}\\b`, 'm');
      const m = re.exec(document.getText());
      if (!m || m.index === undefined) return null;
      const pos = document.positionAt(m.index);
      return new vscode.Location(document.uri, pos);
    }
  });

  const codeActions = vscode.languages.registerCodeActionsProvider('vibe', {
    provideCodeActions(document, range, ctx) {
      const actions: vscode.CodeAction[] = [];
      const text = document.getText(range);
      if (/Server\(/.test(text) && !/import\s+web/.test(document.getText())) {
        const action = new vscode.CodeAction('Add import web', vscode.CodeActionKind.QuickFix);
        action.edit = new vscode.WorkspaceEdit();
        action.edit.insert(document.uri, new vscode.Position(0, 0), 'import web\n');
        actions.push(action);
      }
      if (/DataFrame|readCSV/.test(text) && !/import\s+data/.test(document.getText())) {
        const action = new vscode.CodeAction('Add import data', vscode.CodeActionKind.QuickFix);
        action.edit = new vscode.WorkspaceEdit();
        action.edit.insert(document.uri, new vscode.Position(0, 0), 'import data\n');
        actions.push(action);
      }
      if (ctx.diagnostics.length > 0) {
        const action = new vscode.CodeAction('Format Vibe document', vscode.CodeActionKind.SourceFixAll);
        action.command = { command: 'vibe.formatDocument', title: 'Format Vibe document' };
        actions.push(action);
      }
      return actions;
    }
  });

  const runLint = async (doc: vscode.TextDocument) => {
    if (doc.languageId !== 'vibe') return;
    const lintOnSave = vscode.workspace.getConfiguration('vibe').get<boolean>('lintOnSave', true);
    if (!lintOnSave) return;

    const diags: vscode.Diagnostic[] = [];
    const lines = doc.getText().split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/\bvar\b/.test(line)) {
        const d = new vscode.Diagnostic(
          new vscode.Range(idx, 0, idx, line.length),
          'Prefer let/const in Vibe v2 style.',
          vscode.DiagnosticSeverity.Information
        );
        diags.push(d);
      }
      if (/TODO/.test(line)) {
        const d = new vscode.Diagnostic(
          new vscode.Range(idx, 0, idx, line.length),
          'TODO left in source.',
          vscode.DiagnosticSeverity.Warning
        );
        diags.push(d);
      }
    });
    diagnostics.set(doc.uri, diags);
  };

  const saveSub = vscode.workspace.onDidSaveTextDocument(runLint);
  const openSub = vscode.workspace.onDidOpenTextDocument(runLint);

  const codeLens = vscode.languages.registerCodeLensProvider('vibe', {
    provideCodeLenses(document) {
      const lenses: vscode.CodeLens[] = [];
      const lines = document.getText().split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (/^\s*fn\s+main\s*\(/.test(line)) {
          lenses.push(new vscode.CodeLens(new vscode.Range(idx, 0, idx, 0), {
            title: 'Run',
            command: 'vibe.run'
          }));
        }
        if (/^\s*test\.it\s*\(/.test(line)) {
          lenses.push(new vscode.CodeLens(new vscode.Range(idx, 0, idx, 0), {
            title: 'Run Tests',
            command: 'vibe.runTests'
          }));
        }
      });
      return lenses;
    }
  });

  const symbols = vscode.languages.registerDocumentSymbolProvider('vibe', {
    provideDocumentSymbols(document) {
      return parseSymbols(document);
    }
  });

  const colorProvider = vscode.languages.registerColorProvider('vibe', {
    provideDocumentColors(document) {
      const result: vscode.ColorInformation[] = [];
      const re = /"#([0-9a-fA-F]{6})"/g;
      const text = document.getText();
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const rgb = m[1];
        const r = parseInt(rgb.slice(0, 2), 16) / 255;
        const g = parseInt(rgb.slice(2, 4), 16) / 255;
        const b = parseInt(rgb.slice(4, 6), 16) / 255;
        const start = document.positionAt(m.index + 1);
        const end = document.positionAt(m.index + 8);
        result.push(new vscode.ColorInformation(new vscode.Range(start, end), new vscode.Color(r, g, b, 1)));
      }
      return result;
    },
    provideColorPresentations(color) {
      const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
      const label = `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
      return [new vscode.ColorPresentation(label)];
    }
  });

  const folding = vscode.languages.registerFoldingRangeProvider('vibe', {
    provideFoldingRanges(document) {
      const ranges: vscode.FoldingRange[] = [];
      const lines = document.getText().split(/\r?\n/);
      const stack: number[] = [];
      lines.forEach((line, idx) => {
        if (line.includes('{')) stack.push(idx);
        if (line.includes('}') && stack.length) {
          const start = stack.pop()!;
          if (idx > start + 1) ranges.push(new vscode.FoldingRange(start, idx));
        }
      });
      return ranges;
    }
  });

  context.subscriptions.push(
    runCurrent,
    runFile,
    buildFile,
    checkFile,
    runTests,
    openDocs,
    newProject,
    insertSnippet,
    runSelection,
    openRepl,
    debugAI,
    formatCmd,
    fmtProvider,
    hover,
    completion,
    signature,
    definition,
    codeActions,
    saveSub,
    openSub,
    codeLens,
    symbols,
    colorProvider,
    folding
  );
}

export function deactivate() {}
