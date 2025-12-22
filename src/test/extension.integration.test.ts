import * as assert from 'assert';
import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';

suite('Extension Integration Tests', () => {
  let context: vscode.ExtensionContext;

  setup(() => {
    context = {
      subscriptions: [],
      extensionUri: vscode.Uri.parse('file:///test-extension'),
      extensionPath: '/test-extension',
      globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        setKeysForSync: () => {},
      },
      workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        setKeysForSync: () => {},
      },
      secrets: {
        get: () => Promise.resolve(undefined),
        store: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        onDidChange: new vscode.EventEmitter().event,
      },
      extensionMode: vscode.ExtensionMode.Test,
      logUri: vscode.Uri.parse('file:///test-logs'),
      storageUri: vscode.Uri.parse('file:///test-storage'),
      globalStorageUri: vscode.Uri.parse('file:///test-global-storage'),
      logPath: '/test-logs',
      storagePath: '/test-storage',
      globalStoragePath: '/test-global-storage',
      environmentVariableCollection: {} as any,
      asAbsolutePath: (path: string) => path,
      extension: {} as any,
      languageModelAccessInformation: {} as any,
    } as unknown as vscode.ExtensionContext;
  });

  test('activate completes without errors', async () => {
    await assert.doesNotReject(async () => {
      await activate(context);
    });
  });

  test('deactivate does not throw', () => {
    assert.doesNotThrow(() => {
      deactivate();
    });
  });
});
