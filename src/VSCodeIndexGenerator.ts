import * as vscode from 'vscode'
import { IndexGenerator } from './IndexGenerator'

export class VSCodeIndexGenerator {
  constructor(private document: vscode.TextDocument) {}

  async generateIndex() {
    const edit = new vscode.WorkspaceEdit()
    const generator = new IndexGenerator({
      filePath: this.document.uri.fsPath,
      fileContent: this.document.getText(),
      onWarning: vscode.window.showWarningMessage,
      onGenerate: ({ code, marker }) => {
        return edit.replace(
          this.document.uri,
          new vscode.Range(
            this.document.positionAt(marker.start),
            this.document.positionAt(marker.end),
          ),
          code,
        )
      },
    })
    await generator.generate()
    await vscode.workspace.applyEdit(edit)
  }
}
