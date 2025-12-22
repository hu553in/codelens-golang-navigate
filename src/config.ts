import * as vscode from 'vscode';
import { LogLevel } from './logger';

export type ExtensionConfig = {
  enableCodeLensActions: boolean;
  enableHoverLinks: boolean;
  logLevel: LogLevel;
  refreshOnTyping: boolean;
  refreshDebounceMs: number;
};

const SECTION = 'codelensGolangNavigate';

export function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  return {
    enableCodeLensActions: cfg.get<boolean>('enableCodeLensActions', true),
    enableHoverLinks: cfg.get<boolean>('enableHoverLinks', true),
    logLevel: cfg.get<LogLevel>('logLevel', 'info'),
    refreshOnTyping: cfg.get<boolean>('refreshOnTyping', true),
    refreshDebounceMs: cfg.get<number>('refreshDebounceMs', 120),
  };
}

export function affectsOurConfig(e: vscode.ConfigurationChangeEvent): boolean {
  return e.affectsConfiguration(SECTION);
}
