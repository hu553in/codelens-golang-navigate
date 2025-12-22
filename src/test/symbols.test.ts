import * as assert from 'assert';
import * as vscode from 'vscode';
import { Logger } from '../logger';
import { SymbolService } from '../symbols';

suite('SymbolService Tests', () => {
  let logger: Logger;
  let symbolService: SymbolService;
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

    symbolService = new SymbolService(logger);
  });

  teardown(() => {
    symbolService.dispose();
    logger.dispose();
  });

  test('SymbolService initializes with empty cache', () => {
    const cache = (symbolService as any).cache;
    assert.strictEqual(cache.size, 0);
  });

  test('dispose clears cache', () => {
    const cache = (symbolService as any).cache;
    cache.set('test', { version: 1, symbols: [] });

    assert.strictEqual(cache.size, 1);

    symbolService.dispose();
    assert.strictEqual(cache.size, 0);
  });

  test('getFlattenedSymbols flattens nested symbols', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      version: 1,
      languageId: 'go',
    } as vscode.TextDocument;

    const originalExecuteCommand = vscode.commands.executeCommand;
    let executeCommandCalled = false;

    (vscode.commands as any).executeCommand = async (command: string) => {
      executeCommandCalled = true;
      assert.strictEqual(command, 'vscode.executeDocumentSymbolProvider');

      return [
        {
          name: 'func1',
          kind: vscode.SymbolKind.Function,
          range: new vscode.Range(0, 0, 0, 10),
          selectionRange: new vscode.Range(0, 0, 0, 10),
          children: [
            {
              name: 'nested1',
              kind: vscode.SymbolKind.Variable,
              range: new vscode.Range(1, 0, 1, 5),
              selectionRange: new vscode.Range(1, 0, 1, 5),
              children: [],
            },
          ],
        },
        {
          name: 'func2',
          kind: vscode.SymbolKind.Function,
          range: new vscode.Range(5, 0, 5, 10),
          selectionRange: new vscode.Range(5, 0, 5, 10),
          children: [],
        },
      ];
    };

    try {
      const symbols = await symbolService.getFlattenedSymbols(mockDocument);

      assert.strictEqual(executeCommandCalled, true);
      assert.strictEqual(symbols.length, 3);

      assert.strictEqual(symbols[0].name, 'func1');
      assert.strictEqual(symbols[1].name, 'nested1');
      assert.strictEqual(symbols[2].name, 'func2');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('getFlattenedSymbols uses cache for same document version', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      version: 1,
      languageId: 'go',
    } as vscode.TextDocument;

    let executeCommandCallCount = 0;
    const originalExecuteCommand = vscode.commands.executeCommand;

    (vscode.commands as any).executeCommand = async () => {
      executeCommandCallCount++;
      return [
        {
          name: 'func1',
          kind: vscode.SymbolKind.Function,
          range: new vscode.Range(0, 0, 0, 10),
          selectionRange: new vscode.Range(0, 0, 0, 10),
          children: [],
        },
      ];
    };

    try {
      await symbolService.getFlattenedSymbols(mockDocument);
      assert.strictEqual(executeCommandCallCount, 1);

      await symbolService.getFlattenedSymbols(mockDocument);
      assert.strictEqual(executeCommandCallCount, 1);

      (mockDocument as any).version = 2;
      await symbolService.getFlattenedSymbols(mockDocument);
      assert.strictEqual(executeCommandCallCount, 2);
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('getFlattenedSymbols handles empty symbols array', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      version: 1,
      languageId: 'go',
    } as vscode.TextDocument;

    const originalExecuteCommand = vscode.commands.executeCommand;
    (vscode.commands as any).executeCommand = async () => {
      return [];
    };

    try {
      const symbols = await symbolService.getFlattenedSymbols(mockDocument);
      assert.strictEqual(symbols.length, 0);
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('getFlattenedSymbols handles null/undefined return from command', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      version: 1,
      languageId: 'go',
    } as vscode.TextDocument;

    const originalExecuteCommand = vscode.commands.executeCommand;
    (vscode.commands as any).executeCommand = async () => {
      return null;
    };

    try {
      const symbols = await symbolService.getFlattenedSymbols(mockDocument);
      assert.strictEqual(symbols.length, 0);
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('getFlattenedSymbols handles command execution errors', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      version: 1,
      languageId: 'go',
    } as vscode.TextDocument;

    const originalExecuteCommand = vscode.commands.executeCommand;
    (vscode.commands as any).executeCommand = async () => {
      throw new Error('Command failed');
    };

    try {
      const symbols = await symbolService.getFlattenedSymbols(mockDocument);
      assert.strictEqual(symbols.length, 0);
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('getFlattenedSymbols preserves symbol properties', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      version: 1,
      languageId: 'go',
    } as vscode.TextDocument;

    const testRange = new vscode.Range(1, 2, 3, 4);
    const testSelectionRange = new vscode.Range(1, 2, 1, 8);

    const originalExecuteCommand = vscode.commands.executeCommand;
    (vscode.commands as any).executeCommand = async () => {
      return [
        {
          name: 'testFunc',
          kind: vscode.SymbolKind.Function,
          range: testRange,
          selectionRange: testSelectionRange,
          children: [],
        },
      ];
    };

    try {
      const symbols = await symbolService.getFlattenedSymbols(mockDocument);
      assert.strictEqual(symbols.length, 1);

      const symbol = symbols[0];
      assert.strictEqual(symbol.name, 'testFunc');
      assert.strictEqual(symbol.kind, vscode.SymbolKind.Function);
      assert.deepStrictEqual(symbol.range, testRange);
      assert.deepStrictEqual(symbol.selectionRange, testSelectionRange);
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });
});
