import * as vscode from 'vscode';
import { COMMANDS, JumpArgs } from '../commands';
import { getConfig } from '../config';
import { Logger } from '../logger';
import { SymbolService } from '../symbols';

export class GoNavCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChange.event;

  constructor(
    private log: Logger,
    private symbols: SymbolService,
  ) {}

  refresh() {
    this._onDidChange.fire();
  }

  async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
    const start = Date.now();
    const cfg = getConfig();

    if (!cfg.enableCodeLensActions) {
      this.log.debug('Code lenses disabled', { uri: document.uri.fsPath });
      return [];
    }

    const flattened = await this.symbols.getFlattenedSymbols(document);
    const lenses: vscode.CodeLens[] = [];

    for (const s of flattened) {
      const p = s.selectionRange.start;
      const range = new vscode.Range(p, p);

      const args: JumpArgs = {
        uri: document.uri.toString(),
        row: p.line,
        col: p.character,
      };

      for (const c of COMMANDS) {
        lenses.push(
          new vscode.CodeLens(range, {
            title: c.title,
            command: c.command,
            arguments: [args],
          }),
        );
      }
    }

    this.log.info('Code lenses generated', {
      uri: document.uri.fsPath,
      symbols: flattened.length,
      lenses: lenses.length,
      durationMs: Date.now() - start,
    });

    return lenses;
  }
}
