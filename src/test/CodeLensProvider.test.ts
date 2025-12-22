import * as assert from 'assert';
import * as vscode from 'vscode';
import { Logger } from '../logger';
import { GoNavCodeLensProvider } from '../providers/CodeLensProvider';
import { SymbolService } from '../symbols';

suite('GoNavCodeLensProvider Tests', () => {
  let logger: Logger;
  let symbolService: SymbolService;
  let provider: GoNavCodeLensProvider;
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
    provider = new GoNavCodeLensProvider(logger, symbolService);
  });

  teardown(() => {
    symbolService.dispose();
    logger.dispose();
  });

  test('GoNavCodeLensProvider initializes with event emitter', () => {
    const emitter = (provider as any)._onDidChange;
    assert.ok(emitter instanceof vscode.EventEmitter);
  });

  test('onDidChangeCodeLenses returns event', () => {
    const event = provider.onDidChangeCodeLenses;
    assert.ok(event);
    assert.strictEqual(typeof event, 'function');
  });

  test('refresh fires change event', () => {
    let eventFired = false;
    const disposable = provider.onDidChangeCodeLenses(() => {
      eventFired = true;
    });

    provider.refresh();
    assert.strictEqual(eventFired, true);

    disposable.dispose();
  });

  test('provideCodeLenses returns empty array when disabled', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: false,
      enableHoverLinks: true,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    try {
      const lenses = await provider.provideCodeLenses(mockDocument);
      assert.strictEqual(lenses.length, 0);
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideCodeLenses generates lenses for symbols', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: true,
      enableHoverLinks: true,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    const mockSymbols = [
      {
        name: 'testFunc',
        kind: vscode.SymbolKind.Function,
        range: new vscode.Range(1, 0, 1, 10),
        selectionRange: new vscode.Range(1, 0, 1, 10),
        children: [],
      },
      {
        name: 'testVar',
        kind: vscode.SymbolKind.Variable,
        range: new vscode.Range(2, 0, 2, 8),
        selectionRange: new vscode.Range(2, 0, 2, 8),
        children: [],
      },
    ];

    (symbolService as any).getFlattenedSymbols = async () => mockSymbols;

    try {
      const lenses = await provider.provideCodeLenses(mockDocument);

      assert.strictEqual(lenses.length, 12);

      for (let i = 0; i < 6; i++) {
        const lens = lenses[i];
        assert.ok(lens.range.isEqual(new vscode.Range(1, 0, 1, 0)));
        assert.ok(lens.command);
        assert.ok(lens.command.command.startsWith('codelensGolangNavigate.'));
        assert.deepStrictEqual(lens.command.arguments, [
          {
            uri: mockDocument.uri.toString(),
            row: 1,
            col: 0,
          },
        ]);
      }

      for (let i = 6; i < 12; i++) {
        const lens = lenses[i];
        assert.ok(lens.range.isEqual(new vscode.Range(2, 0, 2, 0)));
        assert.ok(lens.command);
        assert.ok(lens.command.command.startsWith('codelensGolangNavigate.'));
        assert.deepStrictEqual(lens.command.arguments, [
          {
            uri: mockDocument.uri.toString(),
            row: 2,
            col: 0,
          },
        ]);
      }
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideCodeLenses uses correct command titles', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: true,
      enableHoverLinks: true,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    const mockSymbols = [
      {
        name: 'testFunc',
        kind: vscode.SymbolKind.Function,
        range: new vscode.Range(1, 0, 1, 10),
        selectionRange: new vscode.Range(1, 0, 1, 10),
        children: [],
      },
    ];

    (symbolService as any).getFlattenedSymbols = async () => mockSymbols;

    try {
      const lenses = await provider.provideCodeLenses(mockDocument);

      assert.strictEqual(lenses.length, 6);

      const expectedTitles = [
        '🔍 Definition',
        '🏷️ Type definition',
        '⚙️ Implementations',
        '🏗️ Type hierarchy',
        '📞 Callers',
        '🔗 References',
      ];

      expectedTitles.forEach((expectedTitle, index) => {
        assert.ok(lenses[index].command);
        assert.strictEqual(lenses[index].command!.title, expectedTitle);
      });
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideCodeLenses handles empty symbols array', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: true,
      enableHoverLinks: true,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    (symbolService as any).getFlattenedSymbols = async () => [];

    try {
      const lenses = await provider.provideCodeLenses(mockDocument);
      assert.strictEqual(lenses.length, 0);
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideCodeLenses creates correct JumpArgs', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: true,
      enableHoverLinks: true,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    const mockSymbols = [
      {
        name: 'testFunc',
        kind: vscode.SymbolKind.Function,
        range: new vscode.Range(5, 2, 5, 12),
        selectionRange: new vscode.Range(5, 4, 5, 12),
        children: [],
      },
    ];

    (symbolService as any).getFlattenedSymbols = async () => mockSymbols;

    try {
      const lenses = await provider.provideCodeLenses(mockDocument);

      assert.strictEqual(lenses.length, 6);

      lenses.forEach((lens) => {
        assert.ok(lens.command);
        assert.deepStrictEqual(lens.command!.arguments, [
          {
            uri: mockDocument.uri.toString(),
            row: 5,
            col: 4,
          },
        ]);
      });
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });
});
