import * as vscode from 'vscode';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
type LevelTag = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

const ORDER: Record<LogLevel, number> = {
  error: 40,
  warn: 30,
  info: 20,
  debug: 10,
};

export class Logger {
  private channel: vscode.OutputChannel;
  private minLevel: LogLevel = 'info';

  constructor(name: string) {
    this.channel = vscode.window.createOutputChannel(name);
  }

  setLevel(level: LogLevel) {
    this.minLevel = level;
    this.info('Log level updated', { level });
  }

  dispose() {
    this.channel.dispose();
  }

  private shouldLog(level: LogLevel): boolean {
    return ORDER[level] >= ORDER[this.minLevel];
  }

  private write(tag: LevelTag, message: string, args: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const tail = Object.keys(args).length ? ` ${JSON.stringify(args, null, 2)}` : '';
    this.channel.appendLine(`[${timestamp}] [${tag}] ${message}${tail}`);
  }

  error(message: string, args: Record<string, unknown> = {}) {
    if (this.shouldLog('error')) this.write('ERROR', message, args);
  }
  warn(message: string, args: Record<string, unknown> = {}) {
    if (this.shouldLog('warn')) this.write('WARN', message, args);
  }
  info(message: string, args: Record<string, unknown> = {}) {
    if (this.shouldLog('info')) this.write('INFO', message, args);
  }
  debug(message: string, args: Record<string, unknown> = {}) {
    if (this.shouldLog('debug')) this.write('DEBUG', message, args);
  }
}
