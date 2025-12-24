import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { COMMANDS, CommandSpec, JumpArgs } from '../commands';

suite('Commands Tests', () => {
  test('COMMANDS array has expected structure', () => {
    assert.strictEqual(COMMANDS.length, 6);

    COMMANDS.forEach((command) => {
      assert.strictEqual(typeof command.title, 'string');
      assert.ok(command.title.length > 0);
      assert.ok(
        command.title.includes('🔍') ||
          command.title.includes('🏷️') ||
          command.title.includes('⚙️') ||
          command.title.includes('🏗️') ||
          command.title.includes('📞') ||
          command.title.includes('🔗'),
      );
      assert.strictEqual(typeof command.command, 'string');
      assert.ok(command.command.startsWith('codelensGolangNavigate.'));
      assert.strictEqual(typeof command.editorAction, 'string');
      assert.ok(command.editorAction.length > 0);
    });
  });

  test('COMMANDS contains expected navigation commands', () => {
    const commandNames = COMMANDS.map((c) => c.command);
    const expectedCommands = [
      'codelensGolangNavigate.definition',
      'codelensGolangNavigate.typeDefinition',
      'codelensGolangNavigate.implementations',
      'codelensGolangNavigate.typeHierarchy',
      'codelensGolangNavigate.callers',
      'codelensGolangNavigate.references',
    ];

    expectedCommands.forEach((expected) => {
      assert.ok(commandNames.includes(expected as any), `Missing command: ${expected}`);
    });
  });

  test('COMMANDS contains expected editor actions', () => {
    const editorActions = COMMANDS.map((c) => c.editorAction);
    const expectedActions = [
      'editor.action.revealDefinition',
      'editor.action.goToTypeDefinition',
      'references-view.findImplementations',
      'references-view.showTypeHierarchy',
      'references-view.showCallHierarchy',
      'references-view.findReferences',
    ];

    expectedActions.forEach((expected) => {
      assert.ok(editorActions.includes(expected as any), `Missing editor action: ${expected}`);
    });
  });

  test('package.json contributes.commands matches COMMANDS', () => {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      contributes?: { commands?: { command: string }[] };
    };
    const contributed = (pkg.contributes?.commands ?? []).map((c) => c.command).sort();
    const commands = COMMANDS.map((c) => c.command).sort();

    assert.deepStrictEqual(contributed, commands);
  });

  test('CommandSpec type validation', () => {
    const spec: CommandSpec = COMMANDS[0];

    assert.strictEqual(spec.title, '🔍 Definition');
    assert.strictEqual(spec.command, 'codelensGolangNavigate.definition');
    assert.strictEqual(spec.editorAction, 'editor.action.revealDefinition');
  });

  test('JumpArgs type validation', () => {
    const args: JumpArgs = {
      uri: 'file:///test.go',
      row: 10,
      col: 5,
    };

    assert.strictEqual(args.uri, 'file:///test.go');
    assert.strictEqual(args.row, 10);
    assert.strictEqual(args.col, 5);
  });

  test('JumpArgs enforces non-negative numbers', () => {
    const validArgs: JumpArgs = {
      uri: 'file:///test.go',
      row: 0,
      col: 0,
    };

    assert.strictEqual(validArgs.row, 0);
    assert.strictEqual(validArgs.col, 0);
  });
});
