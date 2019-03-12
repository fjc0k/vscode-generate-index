import * as vscode from 'vscode'
import Generator from './Generator'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.generateIndex',
      async () => {
        const { activeTextEditor } = vscode.window
        if (!activeTextEditor) {
          return vscode.window.showWarningMessage('No active editor!')
        }
        const generator = new Generator(activeTextEditor.document)
        await generator.generateIndex()
      },
    ),
  )
}
