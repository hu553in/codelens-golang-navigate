import * as vscode from 'vscode';
import { COMMANDS, JumpArgs } from '../commands';
import { getConfig } from '../config';
import { Logger } from '../logger';
import { SymbolService } from '../symbols';

export function commandUri(command: string, args: JumpArgs): vscode.Uri {
  return vscode.Uri.parse(`command:${command}?${encodeURIComponent(JSON.stringify(args))}`);
}

export function hoverLinksMarkdown(args: JumpArgs): vscode.MarkdownString {
  const md = new vscode.MarkdownString(undefined, true);
  md.isTrusted = true;

  const links = COMMANDS.map((c) => `[${c.title}](${String(commandUri(c.command, args))})`).join(
    ' | ',
  );

  md.appendMarkdown(links);
  return md;
}

export function rangeSize(r: vscode.Range): number {
  return (r.end.line - r.start.line) * 10000 + (r.end.character - r.start.character);
}

export class GoNavHoverProvider implements vscode.HoverProvider {
  constructor(
    private log: Logger,
    private symbols: SymbolService,
  ) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    const start = Date.now();
    const cfg = getConfig();

    if (!cfg.enableHoverLinks) return;

    const flattened = await this.symbols.getFlattenedSymbols(document);
    const matching = flattened.filter((s) => s.selectionRange.contains(position));

    if (!matching.length) return;

    // pick the smallest containing symbol
    const match = matching.sort(
      (a, b) => rangeSize(a.selectionRange) - rangeSize(b.selectionRange),
    )[0];

    const p = match.selectionRange.start;
    const args: JumpArgs = {
      uri: document.uri.toString(),
      row: p.line,
      col: p.character,
    };

    this.log.debug('Hover generated', {
      uri: document.uri.fsPath,
      symbol: match.name,
      durationMs: Date.now() - start,
    });

    return new vscode.Hover(hoverLinksMarkdown(args), match.selectionRange);
  }
}
