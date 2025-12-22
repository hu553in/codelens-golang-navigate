import * as assert from 'assert';
import { debounce } from '../debounce';

suite('Debounce Tests', () => {
  test('debounced function maintains original function signature', () => {
    const original = (..._args: any[]) => 'test';
    const debounced = debounce(original, 100);

    assert.doesNotThrow(() => {
      debounced('test', 42);
    });
  });

  test('debounce delays function execution', (done) => {
    let called = false;
    const fn = (..._args: any[]) => {
      called = true;
    };
    const debounced = debounce(fn, 50);

    debounced();

    assert.strictEqual(called, false);

    setTimeout(() => {
      assert.strictEqual(called, true);
      done();
    }, 60);
  });

  test('debounce cancels previous calls', (done) => {
    let callCount = 0;
    const fn = () => {
      callCount++;
    };
    const debounced = debounce(fn, 50);

    debounced();
    debounced();
    debounced();

    setTimeout(() => {
      assert.strictEqual(callCount, 1);
      done();
    }, 100);
  });

  test('debounce passes arguments to original function', (done) => {
    let receivedArgs: any[] = [];
    const fn = (...args: any[]) => {
      receivedArgs = args;
    };
    const debounced = debounce(fn, 50);

    debounced('arg1', 42, { key: 'value' });

    setTimeout(() => {
      assert.deepStrictEqual(receivedArgs, ['arg1', 42, { key: 'value' }]);
      done();
    }, 60);
  });

  test('debounce works with zero delay', (done) => {
    let called = false;
    const fn = () => {
      called = true;
    };
    const debounced = debounce(fn, 0);

    debounced();

    setTimeout(() => {
      assert.strictEqual(called, true);
      done();
    }, 1);
  });

  test('debounce handles multiple rapid calls correctly', (done) => {
    let callCount = 0;
    const fn = () => {
      callCount++;
    };
    const debounced = debounce(fn, 30);

    debounced();
    setTimeout(() => debounced(), 5);
    setTimeout(() => debounced(), 10);
    setTimeout(() => debounced(), 15);
    setTimeout(() => debounced(), 20);

    setTimeout(() => {
      assert.strictEqual(callCount, 1);
      done();
    }, 60);
  });

  test('debounce preserves this context', (done) => {
    const context = { value: 'test' };
    let capturedThis: any;

    const fn = function (this: any, ..._args: any[]) {
      capturedThis = this;
    };

    const debounced = debounce(fn.bind(context), 50);
    debounced();

    setTimeout(() => {
      assert.strictEqual(capturedThis, context);
      done();
    }, 60);
  });
});
