export type JumpArgs = {
  uri: string;
  row: number;
  col: number;
};

export const COMMANDS = [
  {
    title: '🔍 Definition',
    command: 'codelensGolangNavigate.definition',
    editorAction: 'editor.action.revealDefinition',
  },
  {
    title: '🏷️ Type definition',
    command: 'codelensGolangNavigate.typeDefinition',
    editorAction: 'editor.action.goToTypeDefinition',
  },
  {
    title: '⚙️ Implementations',
    command: 'codelensGolangNavigate.implementations',
    editorAction: 'editor.action.references-view.findImplementations',
  },
  {
    title: '🏗️ Type hierarchy',
    command: 'codelensGolangNavigate.typeHierarchy',
    editorAction: 'editor.action.references-view.showTypeHierarchy',
  },
  {
    title: '📞 Callers',
    command: 'codelensGolangNavigate.callers',
    editorAction: 'editor.action.references-view.showCallHierarchy',
  },
  {
    title: '🔗 References',
    command: 'codelensGolangNavigate.references',
    editorAction: 'editor.action.references-view.findReferences',
  },
] as const;

export type CommandSpec = (typeof COMMANDS)[number];
