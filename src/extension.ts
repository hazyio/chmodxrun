import * as vscode from "vscode";
import { registerCommands } from "./commands";
export const runningTerminals = new WeakSet<vscode.Terminal>();

export function activate(context: vscode.ExtensionContext) {
  // Mark terminal as busy when a command starts.
  context.subscriptions.push(
    vscode.window.onDidStartTerminalShellExecution((event) => {
      runningTerminals.add(event.terminal);
    }),
  );

  // Mark terminal as idle when the command ends.
  context.subscriptions.push(
    vscode.window.onDidEndTerminalShellExecution((event) => {
      runningTerminals.delete(event.terminal);
    }),
  );

  // Clean up closed terminals.
  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((terminal) => {
      runningTerminals.delete(terminal);
    }),
  );
  registerCommands(context);
}

export function deactivate() {}
