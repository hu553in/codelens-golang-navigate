import * as vscode from 'vscode';
import { Logger } from './logger';

type CacheEntry = {
  version: number;
  symbols: vscode.DocumentSymbol[];
};

export class SymbolService {
  private cache = new Map<string, CacheEntry>();

  constructor(private log: Logger) {}

  dispose() {
    this.cache.clear();
  }

  async getFlattenedSymbols(doc: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
    const key = doc.uri.toString();
    const cached = this.cache.get(key);
    if (cached && cached.version === doc.version) {
      return flattenSymbols(cached.symbols);
    }

    let symbols: vscode.DocumentSymbol[] = [];
    try {
      symbols =
        (await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
          'vscode.executeDocumentSymbolProvider',
          doc.uri,
        )) ?? [];
      this.cache.set(key, { version: doc.version, symbols });
      this.log.debug('Document symbols retrieved', { uri: doc.uri.fsPath, count: symbols.length });
    } catch (e) {
      this.log.error('Document symbols retrieval failed', {
        uri: doc.uri.fsPath,
        error: e instanceof Error ? e.message : String(e),
      });
      return [];
    }

    return flattenSymbols(symbols);
  }
}

function flattenSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
  const out: vscode.DocumentSymbol[] = [];
  const walk = (arr: vscode.DocumentSymbol[]) => {
    for (const s of arr) {
      out.push(s);
      if (s.children?.length) walk(s.children);
    }
  };
  walk(symbols);
  return out;
}
