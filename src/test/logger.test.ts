import * as assert from 'assert';
import * as vscode from 'vscode';
import { Logger, LogLevel } from '../logger';

suite('Logger Tests', () => {
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

  test('Logger initializes with default level', () => {
    assert.strictEqual((logger as any).minLevel, 'info');
  });

  test('setLevel updates log level', () => {
    logger.setLevel('debug');
    assert.strictEqual((logger as any).minLevel, 'debug');

    logger.setLevel('error');
    assert.strictEqual((logger as any).minLevel, 'error');
  });

  test('shouldLog respects log levels', () => {
    logger.setLevel('info');

    assert.strictEqual((logger as any).shouldLog('debug'), false);
    assert.strictEqual((logger as any).shouldLog('info'), true);
    assert.strictEqual((logger as any).shouldLog('warn'), true);
    assert.strictEqual((logger as any).shouldLog('error'), true);

    logger.setLevel('debug');
    assert.strictEqual((logger as any).shouldLog('debug'), true);

    logger.setLevel('error');
    assert.strictEqual((logger as any).shouldLog('info'), false);
    assert.strictEqual((logger as any).shouldLog('error'), true);
  });

  test('LogLevel type validation', () => {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];

    levels.forEach((level) => {
      logger.setLevel(level);
      assert.strictEqual((logger as any).minLevel, level);
    });
  });

  test('write method formats messages correctly', () => {
    let capturedMessage = '';
    mockChannel.appendLine = (message: string) => {
      capturedMessage = message;
    };

    const testLogger = new Logger('test');
    (testLogger as any).channel = mockChannel;

    (testLogger as any).write('INFO', 'Test message', {});
    assert.ok(capturedMessage.includes('[INFO] Test message'));
    assert.ok(capturedMessage.includes('Test message'));

    (testLogger as any).write('DEBUG', 'Debug message', { key: 'value', number: 42 });
    assert.ok(capturedMessage.includes('[DEBUG] Debug message'));
    assert.ok(capturedMessage.includes('"key": "value"'));
    assert.ok(capturedMessage.includes('"number": 42'));
  });

  test('error method calls write with correct level', () => {
    let capturedTag = '';
    mockChannel.appendLine = (message: string) => {
      capturedTag = message.split('[')[2].split(']')[0];
    };

    logger.error('Test error');
    assert.strictEqual(capturedTag, 'ERROR');
  });

  test('warn method calls write with correct level', () => {
    let capturedTag = '';
    mockChannel.appendLine = (message: string) => {
      capturedTag = message.split('[')[2].split(']')[0];
    };

    logger.warn('Test warning');
    assert.strictEqual(capturedTag, 'WARN');
  });

  test('info method calls write with correct level', () => {
    let capturedTag = '';
    mockChannel.appendLine = (message: string) => {
      capturedTag = message.split('[')[2].split(']')[0];
    };

    logger.info('Test info');
    assert.strictEqual(capturedTag, 'INFO');
  });

  test('debug method calls write with correct level', () => {
    let capturedTag = '';
    mockChannel.appendLine = (message: string) => {
      capturedTag = message.split('[')[2].split(']')[0];
    };

    logger.setLevel('debug');
    logger.debug('Test debug');
    assert.strictEqual(capturedTag, 'DEBUG');
  });

  test('logging methods accept empty args object', () => {
    assert.doesNotThrow(() => {
      logger.error('Test');
      logger.warn('Test');
      logger.info('Test');
      logger.debug('Test');
    });
  });

  test('logging methods accept args object', () => {
    const args = { test: 'value', count: 1 };

    assert.doesNotThrow(() => {
      logger.error('Test', args);
      logger.warn('Test', args);
      logger.info('Test', args);
      logger.debug('Test', args);
    });
  });

  test('dispose calls channel dispose', () => {
    let disposed = false;
    mockChannel.dispose = () => {
      disposed = true;
    };

    logger.dispose();
    assert.strictEqual(disposed, true);
  });
});
