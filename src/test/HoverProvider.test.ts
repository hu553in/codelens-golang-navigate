import * as assert from 'assert';
import * as vscode from 'vscode';
import { Logger } from '../logger';
import { GoNavHoverProvider, hoverLinksMarkdown, rangeSize } from '../providers/HoverProvider';
import { SymbolService } from '../symbols';

suite('GoNavHoverProvider Tests', () => {
  let logger: Logger;
  let symbolService: SymbolService;
  let provider: GoNavHoverProvider;
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
    provider = new GoNavHoverProvider(logger, symbolService);
  });

  teardown(() => {
    symbolService.dispose();
    logger.dispose();
  });

  test('provideHover returns undefined when disabled', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const position = new vscode.Position(1, 5);

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: true,
      enableHoverLinks: false,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    try {
      const result = await provider.provideHover(mockDocument, position);
      assert.strictEqual(result, undefined);
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideHover returns undefined when no symbols found', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const position = new vscode.Position(1, 5);

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
      const result = await provider.provideHover(mockDocument, position);
      assert.strictEqual(result, undefined);
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideHover returns undefined when position not in any symbol', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const position = new vscode.Position(10, 5);

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
        selectionRange: new vscode.Range(1, 0, 1, 8),
        children: [],
      },
    ];

    (symbolService as any).getFlattenedSymbols = async () => mockSymbols;

    try {
      const result = await provider.provideHover(mockDocument, position);
      assert.strictEqual(result, undefined);
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideHover returns hover with links for matching symbol', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const position = new vscode.Position(1, 5);

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: true,
      enableHoverLinks: true,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    const testRange = new vscode.Range(1, 0, 1, 10);
    const testSelectionRange = new vscode.Range(1, 0, 1, 8);
    const mockSymbols = [
      {
        name: 'testFunc',
        kind: vscode.SymbolKind.Function,
        range: testRange,
        selectionRange: testSelectionRange,
        children: [],
      },
    ];

    (symbolService as any).getFlattenedSymbols = async () => mockSymbols;

    try {
      const result = await provider.provideHover(mockDocument, position);

      assert.ok(result);
      assert.ok(Array.isArray(result.contents));
      assert.ok(result.contents[0] instanceof vscode.MarkdownString);
      assert.ok(result.range?.isEqual(testSelectionRange));

      const markdown = result.contents[0] as vscode.MarkdownString;
      assert.ok(markdown.value.includes('🔍 Definition'));
      assert.ok(markdown.value.includes('🏷️ Type definition'));
      assert.ok(markdown.value.includes('⚙️ Implementations'));
      assert.ok(markdown.value.includes('🏗️ Type hierarchy'));
      assert.ok(markdown.value.includes('📞 Callers'));
      assert.ok(markdown.value.includes('🔗 References'));
      assert.strictEqual(markdown.isTrusted, true);
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideHover picks smallest containing symbol', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const position = new vscode.Position(1, 5);

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: true,
      enableHoverLinks: true,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    const largeRange = new vscode.Range(0, 0, 5, 10);
    const smallRange = new vscode.Range(1, 2, 1, 8);

    const mockSymbols = [
      {
        name: 'largeFunc',
        kind: vscode.SymbolKind.Function,
        range: largeRange,
        selectionRange: largeRange,
        children: [],
      },
      {
        name: 'smallVar',
        kind: vscode.SymbolKind.Variable,
        range: smallRange,
        selectionRange: smallRange,
        children: [],
      },
    ];

    (symbolService as any).getFlattenedSymbols = async () => mockSymbols;

    try {
      const result = await provider.provideHover(mockDocument, position);

      assert.ok(result);
      assert.ok(Array.isArray(result.contents));
      assert.ok(result.contents[0] instanceof vscode.MarkdownString);
      assert.ok(result.range?.isEqual(smallRange));
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('provideHover creates correct command URIs', async () => {
    const mockDocument = {
      uri: vscode.Uri.parse('file:///test.go'),
      languageId: 'go',
    } as vscode.TextDocument;

    const position = new vscode.Position(1, 5);

    const originalGetConfig = require('../config').getConfig;
    require('../config').getConfig = () => ({
      enableCodeLensActions: true,
      enableHoverLinks: true,
      logLevel: 'info' as const,
      refreshOnTyping: true,
      refreshDebounceMs: 120,
    });

    const testSelectionRange = new vscode.Range(1, 0, 1, 8);
    const mockSymbols = [
      {
        name: 'testFunc',
        kind: vscode.SymbolKind.Function,
        range: new vscode.Range(1, 0, 1, 10),
        selectionRange: testSelectionRange,
        children: [],
      },
    ];

    (symbolService as any).getFlattenedSymbols = async () => mockSymbols;

    try {
      const result = await provider.provideHover(mockDocument, position);

      assert.ok(result);
      assert.ok(Array.isArray(result.contents));
      assert.ok(result.contents[0] instanceof vscode.MarkdownString);
      const markdown = result.contents[0] as vscode.MarkdownString;

      const expectedArgs = {
        uri: mockDocument.uri.toString(),
        row: 1,
        col: 0,
      };
      const encodedArgs = encodeURIComponent(JSON.stringify(expectedArgs));

      assert.ok(
        markdown.value.includes(`command:codelensGolangNavigate.definition?${encodedArgs}`),
      );
      assert.ok(
        markdown.value.includes(`command:codelensGolangNavigate.typeDefinition?${encodedArgs}`),
      );
      assert.ok(
        markdown.value.includes(`command:codelensGolangNavigate.implementations?${encodedArgs}`),
      );
      assert.ok(
        markdown.value.includes(`command:codelensGolangNavigate.typeHierarchy?${encodedArgs}`),
      );
      assert.ok(markdown.value.includes(`command:codelensGolangNavigate.callers?${encodedArgs}`));
      assert.ok(
        markdown.value.includes(`command:codelensGolangNavigate.references?${encodedArgs}`),
      );
    } finally {
      require('../config').getConfig = originalGetConfig;
    }
  });

  test('hoverLinksMarkdown creates trusted markdown with links', () => {
    const args = {
      uri: 'file:///test.go',
      row: 1,
      col: 5,
    };

    const markdown = hoverLinksMarkdown(args);

    assert.ok(markdown instanceof vscode.MarkdownString);
    assert.strictEqual(markdown.isTrusted, true);
    assert.ok(markdown.value.includes('🔍 Definition'));
    assert.ok(markdown.value.includes('🏷️ Type definition'));
    assert.ok(markdown.value.includes('⚙️ Implementations'));
    assert.ok(markdown.value.includes('🏗️ Type hierarchy'));
    assert.ok(markdown.value.includes('📞 Callers'));
    assert.ok(markdown.value.includes('🔗 References'));
  });

  test('rangeSize calculates correct size', () => {
    const singleLine = new vscode.Range(1, 5, 1, 15);
    assert.strictEqual(rangeSize(singleLine), 10);

    const multiLine = new vscode.Range(1, 5, 3, 10);
    assert.strictEqual(rangeSize(multiLine), 20005);

    const zeroWidth = new vscode.Range(1, 5, 1, 5);
    assert.strictEqual(rangeSize(zeroWidth), 0);
  });
});
