import * as vscode from 'vscode';

/**
 * Activates the extension.
 * @param context - The extension context provided by VSCode
 */
export function activate(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand(
        'cursor-agent-modal.openChatInNewWindow',
        openChatInNewWindow
    );

    context.subscriptions.push(disposable);
}

/**
 * Opens a Cursor chat as an editor and moves it to a new window.
 * Uses built-in Cursor commands to achieve the modal-like behavior.
 */
async function openChatInNewWindow(): Promise<void> {
    try {
        // Open chat as editor using Cursor's command
        await vscode.commands.executeCommand('composer.openChatAsEditor');
        
        // Small delay to ensure the chat editor is fully opened
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Move the active editor to a new window
        await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Failed to open chat in new window: ${errorMessage}`);
    }
}

/**
 * Deactivates the extension.
 * Currently no cleanup needed.
 */
export function deactivate(): void {
    // No cleanup required
} 