import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export function registerCommands(context: vscode.ExtensionContext) {
  pushCommand(context, "markExecutable", markExecutable);
  pushCommand(context, "run", runScript);
  pushCommand(context, "runSilent", runScriptSilent);
}

function pushCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  callback: (...args: any[]) => any,
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(`chmodxrun.${commandId}`, callback),
  );
}

function runScript(uri: vscode.Uri) {
  const filePath = uri.fsPath;

  let terminal =
    vscode.window.terminals.find((t) => t.name === "Chmod X Run") ??
    vscode.window.createTerminal("Chmod X Run");

  terminal.show();
  terminal.sendText(`"${filePath}"`);
}

function runScriptSilent(uri: vscode.Uri) {
  const filePath = uri.fsPath;
  const scriptDir = path.dirname(filePath);

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Running ${path.basename(filePath)}`,
      cancellable: false,
    },
    () => {
      return new Promise<void>((resolve) => {
        exec(`"${filePath}"`, { cwd: scriptDir }, (error, stdout, stderr) => {
          if (error) {
            vscode.window.showErrorMessage(
              `Script failed: ${error.message || stderr || "Unknown error"}`,
            );
          } else {
            vscode.window.showInformationMessage(
              `Script completed successfully: ${path.basename(filePath)}`,
            );
          }
          resolve();
        });
      });
    },
  );
}
function markExecutable(uri: vscode.Uri) {
  const filePath = uri.fsPath;

  try {
    const stats = fs.statSync(filePath);
    // add execute bit for owner, group, and others (equivalent to chmod +x)
    fs.chmodSync(filePath, stats.mode | 0o111);

    vscode.window
      .showInformationMessage(
        `Marked executable: ${filePath}`,
        "Run",
        "Run Silently",
      )
      .then((selection) => {
        if (selection === "Run") {
          runScript(uri);
        } else if (selection === "Run Silently") {
          runScriptSilent(uri);
        }
      });
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to mark executable: ${err}`);
  }
}
