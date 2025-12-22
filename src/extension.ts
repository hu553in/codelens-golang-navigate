import * as vscode from 'vscode';
import { COMMANDS } from './commands';
import { affectsOurConfig, getConfig } from './config';
import { debounce } from './debounce';
import { Logger } from './logger';
import { revealAndRunEditorAction } from './navigation';
import { GoNavCodeLensProvider } from './providers/CodeLensProvider';
import { GoNavHoverProvider } from './providers/HoverProvider';
import { SymbolService } from './symbols';

export function activate(context: vscode.ExtensionContext) {
  const log = new Logger('codelens-golang-navigate');
  const symbols = new SymbolService(log);

  let cfg = getConfig();
  log.setLevel(cfg.logLevel);

  const provider = new GoNavCodeLensProvider(log, symbols);
  const selector: vscode.DocumentSelector = [{ language: 'go' }];

  let refreshDebounced = debounce(() => provider.refresh(), cfg.refreshDebounceMs);

  // Commands
  for (const c of COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(c.command, (args: unknown) =>
        revealAndRunEditorAction(log, args, c.editorAction),
      ),
    );
  }

  // Providers
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(selector, provider),
    vscode.languages.registerHoverProvider(selector, new GoNavHoverProvider(log, symbols)),
  );

  // Refresh on typing (active Go editor only)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!cfg.refreshOnTyping) return;

      const active = vscode.window.activeTextEditor?.document;
      if (!active) return;

      // only refresh for the active document (avoid churn from background files)
      if (e.document.uri.toString() !== active.uri.toString()) return;

      // only Go
      if (e.document.languageId !== 'go') return;

      // only actual content changes
      if (!e.contentChanges.length) return;

      refreshDebounced();
    }),
  );

  // Refresh on config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!affectsOurConfig(e)) return;

      cfg = getConfig();
      log.setLevel(cfg.logLevel);

      refreshDebounced = debounce(() => provider.refresh(), cfg.refreshDebounceMs);

      log.info('Configuration changed, refreshing providers', {
        refreshOnTyping: cfg.refreshOnTyping,
        refreshDebounceMs: cfg.refreshDebounceMs,
      });

      refreshDebounced();
    }),
  );

  // Cleanup
  context.subscriptions.push({ dispose: () => symbols.dispose() });
  context.subscriptions.push({ dispose: () => log.dispose() });

  log.info('Extension activation completed');
}

export function deactivate() {}
