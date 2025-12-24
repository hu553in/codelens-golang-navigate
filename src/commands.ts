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
    editorAction: 'references-view.findImplementations',
  },
  {
    title: '🏗️ Type hierarchy',
    command: 'codelensGolangNavigate.typeHierarchy',
    editorAction: 'references-view.showTypeHierarchy',
  },
  {
    title: '📞 Callers',
    command: 'codelensGolangNavigate.callers',
    editorAction: 'references-view.showCallHierarchy',
  },
  {
    title: '🔗 References',
    command: 'codelensGolangNavigate.references',
    editorAction: 'references-view.findReferences',
  },
] as const;

export type CommandSpec = (typeof COMMANDS)[number];
