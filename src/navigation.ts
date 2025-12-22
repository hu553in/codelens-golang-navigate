import * as vscode from 'vscode';
import { JumpArgs } from './commands';
import { Logger } from './logger';

export function isValidArgs(args: unknown): args is JumpArgs {
  if (!args || typeof args !== 'object') return false;
  const a = args as Record<string, unknown>;
  return (
    typeof a.uri === 'string' &&
    typeof a.row === 'number' &&
    typeof a.col === 'number' &&
    Number.isFinite(a.row) &&
    Number.isFinite(a.col) &&
    a.row >= 0 &&
    a.col >= 0
  );
}

export async function revealAndRunEditorAction(
  log: Logger,
  rawArgs: unknown,
  editorAction: string,
) {
  if (!isValidArgs(rawArgs)) {
    log.warn('Invalid navigation args', { rawArgs, editorAction });
    return;
  }

  const args = rawArgs;

  try {
    log.info('Executing navigation command', { editorAction, args });

    const uri = vscode.Uri.parse(args.uri);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, { preview: false });

    const pos = new vscode.Position(args.row, args.col);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(
      new vscode.Range(pos, pos),
      vscode.TextEditorRevealType.InCenterIfOutsideViewport,
    );

    await vscode.commands.executeCommand(editorAction);

    log.info('Navigation command executed', { editorAction, args });
  } catch (e) {
    log.error('Navigation command failed', {
      editorAction,
      args: rawArgs,
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}
