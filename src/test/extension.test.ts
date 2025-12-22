import * as assert from 'assert';
import * as vscode from 'vscode';

import './CodeLensProvider.test';
import './HoverProvider.test';
import './commands.test';
import './config.test';
import './debounce.test';
import './extension.integration.test';
import './logger.test';
import './navigation.test';
import './symbols.test';

suite('Extension Test Suite', () => {
  test('Extension loads successfully', () => {
    assert.strictEqual(typeof vscode, 'object');
    assert.ok(vscode.version);
  });
});
