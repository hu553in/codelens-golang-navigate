export type JumpArgs = {
  uri: string;
  row: number;
  col: number;
};

export const COMMANDS = [
  {
    title: 'Def',
    command: 'codelensGolangNavigate.goToDefinitionAt',
    editorAction: 'editor.action.revealDefinition',
  },
  {
    title: 'Type',
    command: 'codelensGolangNavigate.goToTypeDefinitionAt',
    editorAction: 'editor.action.goToTypeDefinition',
  },
  {
    title: 'Impl',
    command: 'codelensGolangNavigate.goToImplementationAt',
    editorAction: 'editor.action.goToImplementation',
  },
  {
    title: 'Refs',
    command: 'codelensGolangNavigate.goToReferencesAt',
    editorAction: 'editor.action.referenceSearch.trigger',
  },
] as const;

export type CommandSpec = (typeof COMMANDS)[number];
