import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel;

function log(
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  message: string,
  args: Record<string, unknown> = {},
) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message} ${JSON.stringify(args, null, 2)}`;
  outputChannel.appendLine(formattedMessage);
}

type JumpArgs = {
  uri: string;
  row: number;
  col: number;
};

const commands = [
  {
    title: 'Definition',
    command: 'codelensGolangNavigate.goToDefinitionAt',
    editorAction: 'editor.action.revealDefinition',
  },
  {
    title: 'Type',
    command: 'codelensGolangNavigate.goToTypeDefinitionAt',
    editorAction: 'editor.action.goToTypeDefinition',
  },
  {
    title: 'Impl',
    command: 'codelensGolangNavigate.goToImplementationAt',
    editorAction: 'editor.action.goToImplementation',
  },
  {
    title: 'Refs',
    command: 'codelensGolangNavigate.goToReferencesAt',
    editorAction: 'editor.action.referenceSearch.trigger',
  },
] as const;

function configValue<T>(key: string, fallback: T): T {
  const value = vscode.workspace.getConfiguration('codelensGolangNavigate').get<T>(key, fallback);

  log('DEBUG', 'Configuration accessed', { key, value, fallback });
  return value;
}

async function revealAndRunCommand(args: JumpArgs, command: string) {
  try {
    log('INFO', 'Executing navigation command...', { command, args });

    const uri = vscode.Uri.parse(args.uri);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, { preview: false });

    const pos = new vscode.Position(args.row, args.col);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(
      new vscode.Range(pos, pos),
      vscode.TextEditorRevealType.InCenterIfOutsideViewport,
    );

    await vscode.commands.executeCommand(command);
    log('INFO', 'Navigation command executed', { command, args });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log('ERROR', 'Navigation command failed to execute', { command, args, error: errorMsg });
    throw error;
  }
}

function commandUri(command: string, args: JumpArgs): vscode.Uri {
  return vscode.Uri.parse(`command:${command}?${encodeURIComponent(JSON.stringify(args))}`);
}

function hoverLinksMarkdown(args: JumpArgs): vscode.MarkdownString {
  const md = new vscode.MarkdownString(undefined, true);
  md.isTrusted = true;
  md.appendMarkdown(
    commands.map((c) => `[${c.title}](${String(commandUri(c.command, args))}`).join(' · '),
  );
  return md;
}

async function getDocSymbols(doc: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
  try {
    const symbols =
      (await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        doc.uri,
      )) ?? [];

    log('DEBUG', 'Document symbols retrieved', { symbols: symbols.length, uri: doc.uri.fsPath });
    return symbols;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log('ERROR', 'Document symbols retrieval failed', { uri: doc.uri.fsPath, error: errorMsg });
    return [];
  }
}

function flattenSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
  const out: vscode.DocumentSymbol[] = [];
  const walk = (arr: vscode.DocumentSymbol[]) => {
    for (const s of arr) {
      out.push(s);
      if (s.children?.length) {
        walk(s.children);
      }
    }
  };
  walk(symbols);

  log('DEBUG', 'Symbols flattened', { symbolsCount: symbols.length, outCount: out.length });
  return out;
}

class CodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChange.event;

  refresh() {
    this._onDidChange.fire();
  }

  async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
    const startTime = Date.now();

    if (!configValue('enableCodeLensActions', true)) {
      log('DEBUG', 'Code lenses disabled', { uri: document.uri.fsPath });
      return [];
    }

    try {
      const symbols = flattenSymbols(await getDocSymbols(document));
      const lenses: vscode.CodeLens[] = [];

      for (const s of symbols) {
        const p = s.selectionRange.start;
        const range = new vscode.Range(p, p);

        const args: JumpArgs = {
          uri: document.uri.toString(),
          row: p.line,
          col: p.character,
        };

        for (const c of commands) {
          lenses.push(
            new vscode.CodeLens(range, {
              title: c.title,
              command: c.command,
              arguments: [args],
            }),
          );
        }
      }

      const duration = Date.now() - startTime;
      log('INFO', 'Code lenses generated', {
        lensesCount: lenses.length,
        uri: document.uri.fsPath,
        duration,
      });
      return lenses;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      log('ERROR', 'Code lenses generation failed', {
        uri: document.uri.fsPath,
        duration,
        error: errorMsg,
      });
      return [];
    }
  }
}

class HoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    const startTime = Date.now();

    if (!configValue('enableHoverLinks', true)) {
      log('DEBUG', 'Hover links disabled', { uri: document.uri.fsPath, position });
      return;
    }

    try {
      const symbols = flattenSymbols(await getDocSymbols(document));

      const matchingSymbols = symbols.filter((s) => s.selectionRange.contains(position));
      log('DEBUG', 'Matching symbols found', {
        symbolsCount: matchingSymbols.length,
        position,
        uri: document.uri.fsPath,
      });

      const match = matchingSymbols.sort((a, b) => {
        const ar = a.selectionRange;
        const br = b.selectionRange;

        const aSize =
          (ar.end.line - ar.start.line) * 10000 + (ar.end.character - ar.start.character);

        const bSize =
          (br.end.line - br.start.line) * 10000 + (br.end.character - br.start.character);

        return aSize - bSize;
      })[0];

      if (!match) {
        log('DEBUG', 'No matching symbol found', { uri: document.uri.fsPath, position });
        return;
      }

      const p = match.selectionRange.start;
      const args: JumpArgs = {
        uri: document.uri.toString(),
        row: p.line,
        col: p.character,
      };

      const duration = Date.now() - startTime;
      log('INFO', 'Hover generated', {
        symbol: match.name,
        uri: document.uri.fsPath,
        position,
        duration,
      });

      return new vscode.Hover(hoverLinksMarkdown(args), match.selectionRange);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      log('ERROR', 'Hover generation failed', {
        uri: document.uri.fsPath,
        position,
        duration,
        error: errorMsg,
      });
      return;
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('codelens-golang-navigate');
  log('INFO', 'Extension activated');

  try {
    for (const c of commands) {
      log('INFO', 'Registering command', { command: c });
      context.subscriptions.push(
        vscode.commands.registerCommand(c.command, (args: JumpArgs) =>
          revealAndRunCommand(args, c.editorAction),
        ),
      );
    }

    const provider = new CodeLensProvider();
    const selector: vscode.DocumentSelector = [{ language: 'go' }];

    log('INFO', 'Registering providers', { selector });
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(selector, provider),
      vscode.languages.registerHoverProvider(selector, new HoverProvider()),
    );

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('codelensGolangNavigate')) {
          log('INFO', 'Configuration changed, refreshing', {
            affectedConfiguration: 'codelensGolangNavigate',
          });
          provider.refresh();
        }
      }),
    );

    log('INFO', 'Extension activation completed');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log('ERROR', 'Extension activation failed', { error: errorMsg });
    throw error;
  }
}
