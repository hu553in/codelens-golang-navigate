import * as assert from 'assert';
import * as vscode from 'vscode';
import { JumpArgs } from '../commands';
import { Logger } from '../logger';
import { revealAndRunEditorAction } from '../navigation';

suite('Navigation Tests', () => {
  let logger: Logger;
  let mockChannel: vscode.OutputChannel;

  setup(() => {
    mockChannel = {
      name: 'test-channel',
      append: () => {},
      appendLine: () => {},
      replace: () => {},
      clear: () => {},
      show: () => {},
      hide: () => {},
      dispose: () => {},
    } as vscode.OutputChannel;

    logger = new Logger('test-logger');
    (logger as any).channel = mockChannel;
  });

  teardown(() => {
    logger.dispose();
  });

  test('isValidArgs returns true for valid JumpArgs', () => {
    const navigationModule = require('../navigation');
    const isValidArgs = (navigationModule as any).isValidArgs;

    const validArgs: JumpArgs = {
      uri: 'file:///test.go',
      row: 10,
      col: 5,
    };

    assert.strictEqual(isValidArgs(validArgs), true);
  });

  test('isValidArgs returns false for invalid types', () => {
    const navigationModule = require('../navigation');
    const isValidArgs = (navigationModule as any).isValidArgs;

    assert.strictEqual(isValidArgs(null), false);
    assert.strictEqual(isValidArgs(undefined), false);
    assert.strictEqual(isValidArgs('string'), false);
    assert.strictEqual(isValidArgs(42), false);
    assert.strictEqual(isValidArgs({}), false);
  });

  test('isValidArgs validates uri property', () => {
    const navigationModule = require('../navigation');
    const isValidArgs = (navigationModule as any).isValidArgs;

    assert.strictEqual(isValidArgs({ row: 10, col: 5 }), false);
    assert.strictEqual(isValidArgs({ uri: 123, row: 10, col: 5 }), false);
    assert.strictEqual(isValidArgs({ uri: '', row: 10, col: 5 }), true);
  });

  test('isValidArgs validates row property', () => {
    const navigationModule = require('../navigation');
    const isValidArgs = (navigationModule as any).isValidArgs;

    assert.strictEqual(isValidArgs({ uri: 'file://test.go', col: 5 }), false);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: '10', col: 5 }), false);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: NaN, col: 5 }), false);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: -1, col: 5 }), false);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 10.5, col: 5 }), true);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 0, col: 5 }), true);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 100, col: 5 }), true);
  });

  test('isValidArgs validates col property', () => {
    const navigationModule = require('../navigation');
    const isValidArgs = (navigationModule as any).isValidArgs;

    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 10 }), false);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 10, col: '5' }), false);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 10, col: NaN }), false);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 10, col: -1 }), false);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 10, col: 5.5 }), true);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 10, col: 0 }), true);
    assert.strictEqual(isValidArgs({ uri: 'file://test.go', row: 10, col: 50 }), true);
  });

  test('revealAndRunEditorAction opens document and shows editor', async () => {
    const args: JumpArgs = {
      uri: 'file:///test.go',
      row: 5,
      col: 10,
    };

    let openedUri: vscode.Uri | undefined;
    let shownEditor: vscode.TextEditor | undefined;
    let executedCommand: string | undefined;

    const originalOpenTextDocument = vscode.workspace.openTextDocument;
    const originalShowTextDocument = vscode.window.showTextDocument;
    const originalExecuteCommand = vscode.commands.executeCommand;

    (vscode.workspace as any).openTextDocument = async (uri: vscode.Uri) => {
      openedUri = uri;
      return {
        uri,
        languageId: 'go',
        version: 1,
        getText: () => 'test content',
        lineCount: 10,
      } as vscode.TextDocument;
    };

    (vscode.window as any).showTextDocument = async (doc: vscode.TextDocument) => {
      shownEditor = {
        document: doc,
        selection: new vscode.Selection(0, 0, 0, 0),
        selections: [new vscode.Selection(0, 0, 0, 0)],
        options: {},
        viewColumn: vscode.ViewColumn.One,
        visibleRanges: [new vscode.Range(0, 0, 10, 0)],
        revealRange: () => {},
        setDecorations: () => {},
        edit: () => Promise.resolve(true),
        insertSnippet: () => Promise.resolve(true),
      } as unknown as vscode.TextEditor;
      return shownEditor;
    };

    (vscode.commands as any).executeCommand = async (command: string) => {
      executedCommand = command;
    };

    try {
      await revealAndRunEditorAction(logger, args, 'test.action');

      assert.strictEqual(openedUri?.toString(), args.uri);
      assert.ok(shownEditor);
      assert.strictEqual(shownEditor.document.uri.toString(), args.uri);
      assert.strictEqual(executedCommand, 'test.action');

      assert.deepStrictEqual(shownEditor.selection.start, new vscode.Position(args.row, args.col));
      assert.deepStrictEqual(shownEditor.selection.end, new vscode.Position(args.row, args.col));
    } finally {
      vscode.workspace.openTextDocument = originalOpenTextDocument;
      vscode.window.showTextDocument = originalShowTextDocument;
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('revealAndRunEditorAction handles invalid args gracefully', async () => {
    const invalidArgs = { invalid: 'args' };

    await assert.doesNotReject(async () =>
      revealAndRunEditorAction(logger, invalidArgs, 'test.action'),
    );
  });

  test('revealAndRunEditorAction handles document open failure', async () => {
    const args: JumpArgs = {
      uri: 'file:///nonexistent.go',
      row: 5,
      col: 10,
    };

    const originalOpenTextDocument = vscode.workspace.openTextDocument;
    (vscode.workspace as any).openTextDocument = async () => {
      throw new Error('Document not found');
    };

    try {
      await assert.rejects(
        async () => revealAndRunEditorAction(logger, args, 'test.action'),
        /Document not found/,
      );
    } finally {
      vscode.workspace.openTextDocument = originalOpenTextDocument;
    }
  });

  test('revealAndRunEditorAction handles show document failure', async () => {
    const args: JumpArgs = {
      uri: 'file:///test.go',
      row: 5,
      col: 10,
    };

    const originalOpenTextDocument = vscode.workspace.openTextDocument;
    const originalShowTextDocument = vscode.window.showTextDocument;

    (vscode.workspace as any).openTextDocument = async () =>
      ({
        uri: vscode.Uri.parse(args.uri),
        languageId: 'go',
        version: 1,
      }) as vscode.TextDocument;

    (vscode.window as any).showTextDocument = async () => {
      throw new Error('Cannot show document');
    };

    try {
      await assert.rejects(
        async () => revealAndRunEditorAction(logger, args, 'test.action'),
        /Cannot show document/,
      );
    } finally {
      vscode.workspace.openTextDocument = originalOpenTextDocument;
      vscode.window.showTextDocument = originalShowTextDocument;
    }
  });

  test('revealAndRunEditorAction handles command execution failure', async () => {
    const args: JumpArgs = {
      uri: 'file:///test.go',
      row: 5,
      col: 10,
    };

    const originalOpenTextDocument = vscode.workspace.openTextDocument;
    const originalShowTextDocument = vscode.window.showTextDocument;
    const originalExecuteCommand = vscode.commands.executeCommand;

    (vscode.workspace as any).openTextDocument = async () =>
      ({
        uri: vscode.Uri.parse(args.uri),
        languageId: 'go',
      }) as vscode.TextDocument;

    (vscode.window as any).showTextDocument = async () =>
      ({
        document: { uri: vscode.Uri.parse(args.uri) },
        selection: new vscode.Selection(0, 0, 0, 0),
        revealRange: () => {},
      }) as unknown as vscode.TextEditor;

    (vscode.commands as any).executeCommand = async () => {
      throw new Error('Command failed');
    };

    try {
      await assert.rejects(
        async () => revealAndRunEditorAction(logger, args, 'test.action'),
        /Command failed/,
      );
    } finally {
      vscode.workspace.openTextDocument = originalOpenTextDocument;
      vscode.window.showTextDocument = originalShowTextDocument;
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });
});
