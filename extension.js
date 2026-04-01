const vscode = require('vscode');
const { exec } = require('child_process');

const MODULES = [
  'dsa', 'neural', 'ai', 'data', 'viz', 'image', 'web', 'db', 'crypto', 'fs', 'async', 'test', 'math', 'audio', 'cloud', 'game', 'web3', 'iot', 'robot', 'quantum'
];

const MODULE_APIS = {
  neural: [
    { name: 'Tensor', signature: 'neural.Tensor(shape, data?)', detail: 'Create a tensor object.', snippet: 'neural.Tensor(${1:shape}, ${2:data})' },
    { name: 'Dense', signature: 'neural.Dense(inFeatures, outFeatures, activation?)', detail: 'Dense layer builder.', snippet: 'neural.Dense(${1:inFeatures}, ${2:outFeatures}, activation: "${3:relu}")' },
    { name: 'Dropout', signature: 'neural.Dropout(rate)', detail: 'Dropout regularization layer.', snippet: 'neural.Dropout(${1:0.3})' },
    { name: 'Conv2D', signature: 'neural.Conv2D(inChannels, outChannels, kernelSize, stride?, padding?)', detail: '2D convolution layer.', snippet: 'neural.Conv2D(${1:inChannels}, ${2:outChannels}, ${3:kernelSize}, stride: ${4:1}, padding: ${5:1})' },
    { name: 'MaxPool2D', signature: 'neural.MaxPool2D(kernelSize, stride?)', detail: '2D max pooling layer.', snippet: 'neural.MaxPool2D(${1:2}, stride: ${2:2})' },
    { name: 'Flatten', signature: 'neural.Flatten()', detail: 'Flatten feature maps.', snippet: 'neural.Flatten()' },
    { name: 'Sequential', signature: 'neural.Sequential(layers)', detail: 'Compose layers sequentially.', snippet: 'neural.Sequential([${1:layers}])' },
    { name: 'SGD', signature: 'neural.SGD(lr?)', detail: 'Stochastic gradient descent optimizer.', snippet: 'neural.SGD(lr: ${1:0.01})' },
    { name: 'Adam', signature: 'neural.Adam(lr?)', detail: 'Adam optimizer.', snippet: 'neural.Adam(lr: ${1:0.001})' },
    { name: 'MSELoss', signature: 'neural.MSELoss()', detail: 'Mean squared error loss.', snippet: 'neural.MSELoss()' },
    { name: 'CrossEntropyLoss', signature: 'neural.CrossEntropyLoss()', detail: 'Cross entropy loss.', snippet: 'neural.CrossEntropyLoss()' },
    { name: 'ReLU', signature: 'neural.ReLU()', detail: 'ReLU activation.', snippet: 'neural.ReLU()' },
    { name: 'Sigmoid', signature: 'neural.Sigmoid()', detail: 'Sigmoid activation.', snippet: 'neural.Sigmoid()' },
    { name: 'Tanh', signature: 'neural.Tanh()', detail: 'Tanh activation.', snippet: 'neural.Tanh()' },
    { name: 'train', signature: 'neural.train(model, data, labels, epochs?)', detail: 'Train helper for model fitting.', snippet: 'neural.train(${1:model}, ${2:data}, ${3:labels}, epochs: ${4:10})' }
  ],
  dsa: [
    { name: 'quickSort', signature: 'dsa.quickSort(values)', detail: 'Sort values using quick sort.', snippet: 'dsa.quickSort(${1:values})' },
    { name: 'bubbleSort', signature: 'dsa.bubbleSort(values)', detail: 'Sort values using bubble sort.', snippet: 'dsa.bubbleSort(${1:values})' },
    { name: 'binarySearch', signature: 'dsa.binarySearch(values, target)', detail: 'Binary search in sorted values.', snippet: 'dsa.binarySearch(${1:values}, ${2:target})' },
    { name: 'linearSearch', signature: 'dsa.linearSearch(values, target)', detail: 'Linear search in values.', snippet: 'dsa.linearSearch(${1:values}, ${2:target})' },
    { name: 'bfs', signature: 'dsa.bfs(graph, start)', detail: 'Breadth-first search traversal.', snippet: 'dsa.bfs(${1:graph}, ${2:start})' },
    { name: 'dfs', signature: 'dsa.dfs(graph, start)', detail: 'Depth-first search traversal.', snippet: 'dsa.dfs(${1:graph}, ${2:start})' },
    { name: 'dijkstra', signature: 'dsa.dijkstra(graph, start)', detail: 'Shortest-path traversal.', snippet: 'dsa.dijkstra(${1:graph}, ${2:start})' },
    { name: 'Graph', signature: 'dsa.Graph(directed?)', detail: 'Graph data structure.', snippet: 'dsa.Graph(directed: ${1:false})' },
    { name: 'MinHeap', signature: 'dsa.MinHeap()', detail: 'Min-heap data structure.', snippet: 'dsa.MinHeap()' },
    { name: 'MaxHeap', signature: 'dsa.MaxHeap()', detail: 'Max-heap data structure.', snippet: 'dsa.MaxHeap()' }
  ],
  ai: [
    { name: 'trainTestSplit', signature: 'ai.trainTestSplit(features, labels, testSize?)', detail: 'Split dataset into train and test sets.', snippet: 'ai.trainTestSplit(${1:features}, ${2:labels}, testSize: ${3:0.2})' },
    { name: 'accuracy', signature: 'ai.accuracy(yTrue, yPred)', detail: 'Accuracy metric.', snippet: 'ai.accuracy(${1:yTrue}, ${2:yPred})' },
    { name: 'precision', signature: 'ai.precision(yTrue, yPred)', detail: 'Precision metric.', snippet: 'ai.precision(${1:yTrue}, ${2:yPred})' },
    { name: 'recall', signature: 'ai.recall(yTrue, yPred)', detail: 'Recall metric.', snippet: 'ai.recall(${1:yTrue}, ${2:yPred})' },
    { name: 'f1Score', signature: 'ai.f1Score(yTrue, yPred)', detail: 'F1-score metric.', snippet: 'ai.f1Score(${1:yTrue}, ${2:yPred})' },
    { name: 'confusionMatrix', signature: 'ai.confusionMatrix(yTrue, yPred)', detail: 'Confusion matrix metric.', snippet: 'ai.confusionMatrix(${1:yTrue}, ${2:yPred})' }
  ],
  data: [
    { name: 'DataFrame', signature: 'data.DataFrame(rows)', detail: 'Create an in-memory table.', snippet: 'data.DataFrame(${1:rows})' },
    { name: 'readCSV', signature: 'data.readCSV(path)', detail: 'Read CSV into a DataFrame.', snippet: 'data.readCSV("${1:data.csv}")' },
    { name: 'writeCSV', signature: 'data.writeCSV(df, path)', detail: 'Write DataFrame to CSV.', snippet: 'data.writeCSV(${1:df}, "${2:output.csv}")' },
    { name: 'head', signature: 'data.head(df, n?)', detail: 'Preview first rows.', snippet: 'data.head(${1:df}, ${2:5})' },
    { name: 'describe', signature: 'data.describe(df)', detail: 'Summarize numeric columns.', snippet: 'data.describe(${1:df})' },
    { name: 'filter', signature: 'data.filter(df, fn)', detail: 'Filter rows with predicate.', snippet: 'data.filter(${1:df}, fn(row) { ${2:return true} })' },
    { name: 'groupBy', signature: 'data.groupBy(df, column)', detail: 'Group DataFrame rows by column.', snippet: 'data.groupBy(${1:df}, "${2:column}")' }
  ],
  image: [
    { name: 'loadImage', signature: 'image.loadImage(path)', detail: 'Load an image from disk.', snippet: 'image.loadImage("${1:input.png}")' },
    { name: 'saveImage', signature: 'image.saveImage(img, path)', detail: 'Save an image to disk.', snippet: 'image.saveImage(${1:img}, "${2:output.png}")' },
    { name: 'resizeImage', signature: 'image.resizeImage(img, width, height)', detail: 'Resize an image.', snippet: 'image.resizeImage(${1:img}, ${2:640}, ${3:480})' },
    { name: 'cropImage', signature: 'image.cropImage(img, x, y, width, height)', detail: 'Crop an image region.', snippet: 'image.cropImage(${1:img}, ${2:0}, ${3:0}, ${4:200}, ${5:200})' },
    { name: 'rotateImage', signature: 'image.rotateImage(img, degrees)', detail: 'Rotate an image.', snippet: 'image.rotateImage(${1:img}, ${2:90})' },
    { name: 'flipImage', signature: 'image.flipImage(img, direction)', detail: 'Flip image horizontally or vertically.', snippet: 'image.flipImage(${1:img}, "${2:horizontal}")' },
    { name: 'adjustBrightness', signature: 'image.adjustBrightness(img, amount)', detail: 'Adjust image brightness.', snippet: 'image.adjustBrightness(${1:img}, ${2:0.15})' },
    { name: 'applyBlur', signature: 'image.applyBlur(img, radius)', detail: 'Apply blur effect.', snippet: 'image.applyBlur(${1:img}, ${2:2})' },
    { name: 'detectEdges', signature: 'image.detectEdges(img)', detail: 'Run edge detection.', snippet: 'image.detectEdges(${1:img})' }
  ]
};

const KEYWORDS = [
  'let', 'const', 'fn', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'match', 'case', 'class', 'interface', 'enum', 'import', 'show', 'try', 'catch', 'finally'
];

const DOCS = {
  show: '**show** - Print values to console.\n\n```vibe\nshow "Hello"\nshow value\n```',
  dsa: '**dsa** - Data Structures and Algorithms module.\n\n```vibe\nimport dsa\nlet stack = dsa.Stack()\n```',
  neural: '**neural** - Deep learning module with tensors, layers, and optimizers.',
  ai: '**ai** - Classical machine learning, NLP, CV, RL, and metrics.',
  data: '**data** - DataFrame and analytics utilities.',
  web: '**web** - HTTP server/client and API framework.',
  async: '**async** - Concurrency primitives and task combinators.',
  test: '**test** - Test runner and assertion framework.',
  image: '**image** - Image processing utilities (load, resize, crop, rotate, blur, edge detection).',
  trainTestSplit: '**ai.trainTestSplit** - Split features/labels into train and test sets.',
  readCSV: '**data.readCSV** - Read CSV into a DataFrame-like structure.',
  quickSort: '**dsa.quickSort** - Sort values with quick sort.',
  Sequential: '**neural.Sequential** - Build neural pipelines from layer blocks.'
};

const IMPORT_ASSISTS = [
  { module: 'web', patterns: [/\bServer\s*\(/, /\bapp\.get\s*\(/] },
  { module: 'data', patterns: [/\breadCSV\s*\(/, /\bDataFrame\b/, /\bgroupBy\s*\(/] },
  { module: 'neural', patterns: [/\bSequential\s*\(/, /\bDense\s*\(/, /\bCrossEntropyLoss\s*\(/] },
  { module: 'dsa', patterns: [/\bquickSort\s*\(/, /\bbinarySearch\s*\(/, /\bGraph\s*\(/] },
  { module: 'ai', patterns: [/\btrainTestSplit\s*\(/, /\baccuracy\s*\(/, /\bf1Score\s*\(/] },
  { module: 'image', patterns: [/\bloadImage\s*\(/, /\bresizeImage\s*\(/, /\bdetectEdges\s*\(/] }
];

function vibeExe() {
  return vscode.workspace.getConfiguration('vibe').get('executablePath', 'vibe');
}

function activeVibeEditor() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'vibe') return null;
  return editor;
}

function runCommand(cmd, cwd) {
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

function formatVibeText(text, tabSize) {
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

function parseSymbols(document) {
  const symbols = [];
  const text = document.getText();
  const lines = text.split(/\r?\n/);

  const pushSymbol = (name, kind, line, endLine) => {
    const range = new vscode.Range(line, 0, endLine, (lines[endLine] || '').length);
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

function activate(context) {
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
    } catch (err) {
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
    if (!folder || !folder.length) return;
    const terminal = vscode.window.createTerminal('Vibe New Project');
    terminal.sendText(`${vibeExe()} init "${folder[0].fsPath}"`);
    terminal.show();
  });

  const insertSnippet = vscode.commands.registerCommand('vibe.insertSnippet', async () => {
    const editor = activeVibeEditor();
    if (!editor) return;
    const pick = await vscode.window.showQuickPick(['Function', 'Class', 'Async Function', 'Match']);
    if (!pick) return;
    const map = {
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
    const terminal = vscode.window.createTerminal('Vibe REPL');
    terminal.sendText(`${vibeExe()} repl`);
    terminal.show();
  });

  const formatCmd = vscode.commands.registerCommand('vibe.formatDocument', async () => {
    const editor = activeVibeEditor();
    if (!editor) return;
    const tabSize = vscode.workspace.getConfiguration('vibe').get('tabSize', 4);
    const formatted = formatVibeText(editor.document.getText(), tabSize);
    await editor.edit((eb) => {
      const full = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
      eb.replace(full, formatted);
    });
  });

  const fmtProvider = vscode.languages.registerDocumentFormattingEditProvider('vibe', {
    provideDocumentFormattingEdits(document) {
      const tabSize = vscode.workspace.getConfiguration('vibe').get('tabSize', 4);
      const formatted = formatVibeText(document.getText(), tabSize);
      const full = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
      return [vscode.TextEdit.replace(full, formatted)];
    }
  });

  const hover = vscode.languages.registerHoverProvider('vibe', {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position);
      if (!range) return undefined;
      const word = document.getText(range);
      const docs = DOCS[word];
      if (!docs) return undefined;
      return new vscode.Hover(new vscode.MarkdownString(docs));
    }
  });

  const completion = vscode.languages.registerCompletionItemProvider('vibe', {
    provideCompletionItems(document, position) {
      const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
      const moduleDotMatch = linePrefix.match(/\b([a-z][a-z0-9_]*)\.[a-zA-Z0-9_]*$/);

      if (moduleDotMatch) {
        const moduleName = moduleDotMatch[1];
        const apis = MODULE_APIS[moduleName] || [];
        return apis.map((api) => {
          const item = new vscode.CompletionItem(api.name, vscode.CompletionItemKind.Method);
          item.detail = api.signature;
          item.documentation = new vscode.MarkdownString(api.detail);
          const callSuffix = api.snippet.startsWith(`${moduleName}.`) ? api.snippet.slice(moduleName.length + 1 + api.name.length) : '()';
          item.insertText = new vscode.SnippetString(`${api.name}${callSuffix}`);
          return item;
        });
      }

      const items = [];
      MODULES.forEach((mod) => {
        const item = new vscode.CompletionItem(mod, vscode.CompletionItemKind.Module);
        item.detail = `Vibe ${mod} module`;
        if (/^\s*import\s+[a-zA-Z0-9_]*$/.test(linePrefix)) {
          item.insertText = mod;
        }
        items.push(item);
      });
      KEYWORDS.forEach((kw) => {
        items.push(new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword));
      });

      Object.entries(MODULE_APIS).forEach(([moduleName, apis]) => {
        apis.forEach((api) => {
          const item = new vscode.CompletionItem(`${moduleName}.${api.name}`, vscode.CompletionItemKind.Function);
          item.detail = api.signature;
          item.documentation = new vscode.MarkdownString(api.detail);
          item.insertText = new vscode.SnippetString(api.snippet);
          items.push(item);
        });
      });

      return items;
    }
  }, '.', ':');

  const signature = vscode.languages.registerSignatureHelpProvider('vibe', {
    provideSignatureHelp(document, position) {
      const line = document.lineAt(position.line).text.slice(0, position.character);
      const fnMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_.]*)\([^()]*$/);
      if (!fnMatch) return null;

      const symbol = fnMatch[1];
      const [moduleName, methodName] = symbol.split('.');
      let signatureLabel = `${symbol}(arg1, arg2, ...)`;
      let signatureDoc = 'Vibe function call';

      if (methodName && MODULE_APIS[moduleName]) {
        const api = MODULE_APIS[moduleName].find((entry) => entry.name === methodName);
        if (api) {
          signatureLabel = api.signature;
          signatureDoc = api.detail;
        }
      }

      const sig = new vscode.SignatureInformation(signatureLabel);
      sig.documentation = new vscode.MarkdownString(signatureDoc);
      sig.parameters = [new vscode.ParameterInformation('arg1'), new vscode.ParameterInformation('arg2')];
      const help = new vscode.SignatureHelp();
      help.signatures = [sig];
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
      return new vscode.Location(document.uri, document.positionAt(m.index));
    }
  });

  const codeActions = vscode.languages.registerCodeActionsProvider('vibe', {
    provideCodeActions(document, range) {
      const actions = [];
      const text = document.getText(range);
      const fullText = document.getText();

      IMPORT_ASSISTS.forEach(({ module, patterns }) => {
        if (!patterns.some((pattern) => pattern.test(text))) return;
        if (new RegExp(`\\bimport\\s+${module}\\b`).test(fullText)) return;
        const action = new vscode.CodeAction(`Add import ${module}`, vscode.CodeActionKind.QuickFix);
        action.edit = new vscode.WorkspaceEdit();
        action.edit.insert(document.uri, new vscode.Position(0, 0), `import ${module}\n`);
        actions.push(action);
      });

      return actions;
    }
  });

  const runLint = async (doc) => {
    if (doc.languageId !== 'vibe') return;
    const lintOnSave = vscode.workspace.getConfiguration('vibe').get('lintOnSave', true);
    if (!lintOnSave) return;

    const diags = [];
    const lines = doc.getText().split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/\bvar\b/.test(line)) {
        diags.push(new vscode.Diagnostic(new vscode.Range(idx, 0, idx, line.length), 'Prefer let/const in Vibe v2 style.', vscode.DiagnosticSeverity.Information));
      }
      if (/^\s*import\s+viz\b/.test(line)) {
        diags.push(new vscode.Diagnostic(new vscode.Range(idx, 0, idx, line.length), 'The viz module is experimental; prefer data + image + web modules in stable v1.2 workflows.', vscode.DiagnosticSeverity.Warning));
      }
    });
    diagnostics.set(doc.uri, diags);
  };

  const saveSub = vscode.workspace.onDidSaveTextDocument(runLint);
  const openSub = vscode.workspace.onDidOpenTextDocument(runLint);

  const codeLens = vscode.languages.registerCodeLensProvider('vibe', {
    provideCodeLenses(document) {
      const lenses = [];
      const lines = document.getText().split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (/^\s*fn\s+main\s*\(/.test(line)) {
          lenses.push(new vscode.CodeLens(new vscode.Range(idx, 0, idx, 0), { title: 'Run', command: 'vibe.run' }));
        }
        if (/^\s*test\.it\s*\(/.test(line)) {
          lenses.push(new vscode.CodeLens(new vscode.Range(idx, 0, idx, 0), { title: 'Run Tests', command: 'vibe.runTests' }));
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
      const result = [];
      const re = /"#([0-9a-fA-F]{6})"/g;
      const text = document.getText();
      let m;
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
      const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
      const label = `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
      return [new vscode.ColorPresentation(label)];
    }
  });

  const folding = vscode.languages.registerFoldingRangeProvider('vibe', {
    provideFoldingRanges(document) {
      const ranges = [];
      const lines = document.getText().split(/\r?\n/);
      const stack = [];
      lines.forEach((line, idx) => {
        if (line.includes('{')) stack.push(idx);
        if (line.includes('}') && stack.length) {
          const start = stack.pop();
          if (idx > start + 1) ranges.push(new vscode.FoldingRange(start, idx));
        }
      });
      return ranges;
    }
  });

  context.subscriptions.push(
    runCurrent, runFile, buildFile, checkFile, runTests, openDocs, newProject,
    insertSnippet, runSelection, openRepl, formatCmd, fmtProvider, hover,
    completion, signature, definition, codeActions, saveSub, openSub,
    codeLens, symbols, colorProvider, folding
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
