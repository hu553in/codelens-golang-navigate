import * as assert from 'assert';
import * as vscode from 'vscode';
import { affectsOurConfig, ExtensionConfig, getConfig } from '../config';

suite('Config Tests', () => {
  test('getConfig returns default values', () => {
    const config = getConfig();

    assert.strictEqual(typeof config.enableCodeLensActions, 'boolean');
    assert.strictEqual(typeof config.enableHoverLinks, 'boolean');
    assert.strictEqual(typeof config.logLevel, 'string');
    assert.strictEqual(typeof config.refreshOnTyping, 'boolean');
    assert.strictEqual(typeof config.refreshDebounceMs, 'number');

    assert.strictEqual(config.enableCodeLensActions, true);
    assert.strictEqual(config.enableHoverLinks, true);
    assert.strictEqual(config.logLevel, 'info');
    assert.strictEqual(config.refreshOnTyping, true);
    assert.strictEqual(config.refreshDebounceMs, 120);
  });

  test('getConfig handles different configuration scenarios', () => {
    const config = getConfig();

    assert.strictEqual(typeof config.enableCodeLensActions, 'boolean');
    assert.strictEqual(typeof config.enableHoverLinks, 'boolean');
    assert.strictEqual(typeof config.logLevel, 'string');
    assert.strictEqual(typeof config.refreshOnTyping, 'boolean');
    assert.strictEqual(typeof config.refreshDebounceMs, 'number');
  });

  test('affectsOurConfig returns true for our configuration section', () => {
    const event = {
      affectsConfiguration: (section: string) => section === 'codelensGolangNavigate',
    } as vscode.ConfigurationChangeEvent;

    assert.strictEqual(affectsOurConfig(event), true);
  });

  test('affectsOurConfig returns false for other configuration sections', () => {
    const event = {
      affectsConfiguration: (section: string) => section === 'otherExtension',
    } as vscode.ConfigurationChangeEvent;

    assert.strictEqual(affectsOurConfig(event), false);
  });

  test('ExtensionConfig type validation', () => {
    const config: ExtensionConfig = {
      enableCodeLensActions: true,
      enableHoverLinks: false,
      logLevel: 'error',
      refreshOnTyping: true,
      refreshDebounceMs: 200,
    };

    assert.strictEqual(config.enableCodeLensActions, true);
    assert.strictEqual(config.enableHoverLinks, false);
    assert.strictEqual(config.logLevel, 'error');
    assert.strictEqual(config.refreshOnTyping, true);
    assert.strictEqual(config.refreshDebounceMs, 200);
  });
});
