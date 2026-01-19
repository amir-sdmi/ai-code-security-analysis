// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Track terminals created by Copilot agents
const copilotTerminals = new WeakSet<vscode.Terminal>();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Copilot Terminal Detection extension is now active!');

	// File-based detection approach (no environment variables due to VS Code API limitations)
	removeAllAgentMarkerFiles(); // Clean up any existing markers
	console.log('Using file-based detection approach only');

	// Listen for terminal creation events
	const terminalOpenDisposable = vscode.window.onDidOpenTerminal((terminal) => {
		// Delay the detection to allow terminal to fully initialize
		setTimeout(() => {
			console.log(`Processing terminal creation event for: ${terminal.name}`);
			const isCopilot = detectCopilotTerminal(terminal);
			console.log(`Detection result for ${terminal.name}: ${isCopilot}`);
			
			if (isCopilot) {
				// Create marker file for file-based detection
				console.log(`About to create marker file for terminal: ${terminal.name}`);
				createAgentMarkerFile(terminal);
				console.log(`Copilot terminal detected: ${terminal.name}, marker file creation attempted`);
			} else {
				console.log(`Non-Copilot terminal: ${terminal.name}, no marker file created`);
			}
		}, 200);
	});

	// Listen for terminal close events to clean up
	const terminalCloseDisposable = vscode.window.onDidCloseTerminal((terminal) => {
		if (copilotTerminals.has(terminal)) {
			copilotTerminals.delete(terminal);
			console.log(`Copilot terminal closed: ${terminal.name}`);
			
			// Remove the marker file for this specific terminal
			removeAgentMarkerFile(terminal);
		}
	});

	// Check existing terminals when extension activates
	let foundCopilotTerminals = false;
	vscode.window.terminals.forEach(terminal => {
		console.log(`Checking existing terminal during activation: ${terminal.name}`);
		const isCopilot = detectCopilotTerminal(terminal);
		if (isCopilot) {
			foundCopilotTerminals = true;
			console.log(`Found existing Copilot terminal during activation: ${terminal.name}`);
		}
	});

	// Create marker file if we found any Copilot terminals during activation
	if (foundCopilotTerminals) {
		console.log('Creating marker files for existing Copilot terminals');
		vscode.window.terminals.forEach(terminal => {
			if (copilotTerminals.has(terminal)) {
				createAgentMarkerFile(terminal);
			}
		});
	}

	console.log('Extension fully activated with terminal monitoring enabled');

	// Register command for manual detection (for testing)
	const detectCommand = vscode.commands.registerCommand('copilot-terminal-detection.detectCopilot', () => {
		const activeTerminal = vscode.window.activeTerminal;
		if (activeTerminal) {
			const isCopilot = detectCopilotTerminal(activeTerminal);
			vscode.window.showInformationMessage(
				isCopilot ? 
				'🤖 Copilot terminal detected and marker file created!' : 
				'Terminal is not from Copilot agent'
			);
		} else {
			vscode.window.showWarningMessage('No active terminal found');
		}
	});

	// Register command to manually create marker file (for testing)
	const createMarkerCommand = vscode.commands.registerCommand('copilot-terminal-detection.createMarker', () => {
		console.log('Manual marker file creation requested');
		const activeTerminal = vscode.window.activeTerminal;
		if (activeTerminal) {
			createAgentMarkerFile(activeTerminal);
			vscode.window.showInformationMessage('Marker file created manually for active terminal');
		} else {
			vscode.window.showWarningMessage('No active terminal found');
		}
	});

	// Register command to check marker file status (for testing)
	const showStatusCommand = vscode.commands.registerCommand('copilot-terminal-detection.showStatus', () => {
		const tempDir = os.tmpdir();
		try {
			const files = fs.readdirSync(tempDir);
			const markerFiles = files.filter(f => f.startsWith('.vscode_copilot_agent_'));
			
			if (markerFiles.length === 0) {
				vscode.window.showInformationMessage('No Copilot marker files found');
			} else {
				const fileInfo = markerFiles.map(file => {
					const filePath = path.join(tempDir, file);
					try {
						const content = fs.readFileSync(filePath, 'utf8');
						const data = JSON.parse(content);
						return `PID ${data.processId}: ${data.terminalName}`;
					} catch {
						return `${file}: (unreadable)`;
					}
				}).join(', ');
				
				vscode.window.showInformationMessage(`Copilot marker files (${markerFiles.length}): ${fileInfo}`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to check marker files: ${error}`);
		}
	});

	// Add disposables to subscriptions
	context.subscriptions.push(
		terminalOpenDisposable,
		terminalCloseDisposable,
		detectCommand,
		createMarkerCommand,
		showStatusCommand
	);
}

/**
 * Detects if a terminal was created by a Copilot agent (file-based detection only)
 */
function detectCopilotTerminal(terminal: vscode.Terminal): boolean {
	// Check terminal name for Copilot-related patterns
	const terminalName = terminal.name.toLowerCase().trim();
	
	console.log(`=== TERMINAL DETECTION DEBUG ===`);
	console.log(`Terminal name: "${terminal.name}" (normalized: "${terminalName}")`);
	console.log(`Terminal creation options:`, terminal.creationOptions);
	
	// Common patterns that indicate Copilot agent terminals
	const copilotPatterns = [
		'copilot',
		'agent',
		'@workspace',
		'@terminal',
		'github copilot',
		'ai assistant',
		'chat participant'
	];

	// Patterns that should NOT be considered Copilot terminals
	const excludePatterns = [
		'zsh',
		'bash',
		'cmd',
		'powershell',
		'fish',
		'sh'
	];

	console.log(`Checking against copilot patterns:`, copilotPatterns);
	console.log(`Checking against exclude patterns:`, excludePatterns);

	// First check if this is a standard shell that should be excluded
	const isStandardShell = excludePatterns.some(pattern => {
		const match = terminalName === pattern || terminalName.startsWith(pattern);
		console.log(`  - "${terminalName}" vs "${pattern}": ${match}`);
		return match;
	});

	if (isStandardShell) {
		console.log(`❌ Standard shell detected (excluded): ${terminal.name}`);
		return false;
	}

	// Check terminal name against Copilot patterns
	let isCopilotTerminal = false;
	copilotPatterns.forEach(pattern => {
		const match = terminalName.includes(pattern);
		console.log(`  + "${terminalName}" includes "${pattern}": ${match}`);
		if (match) {
			isCopilotTerminal = true;
		}
	});

	// Check creation options for additional clues
	const creationOptions = terminal.creationOptions;
	if (creationOptions && 'name' in creationOptions && creationOptions.name) {
		const optionsName = creationOptions.name.toLowerCase().trim();
		console.log(`Creation options name: "${creationOptions.name}" (normalized: "${optionsName}")`);
		
		// Double-check exclusions for creation options
		const optionsIsStandardShell = excludePatterns.some(pattern => {
			const match = optionsName === pattern || optionsName.startsWith(pattern);
			console.log(`  - Creation options "${optionsName}" vs "${pattern}": ${match}`);
			return match;
		});
		
		if (optionsIsStandardShell) {
			console.log(`❌ Standard shell detected in creation options (excluded): ${creationOptions.name}`);
			return false;
		}
		
		// Check creation options against Copilot patterns
		copilotPatterns.forEach(pattern => {
			const match = optionsName.includes(pattern);
			console.log(`  + Creation options "${optionsName}" includes "${pattern}": ${match}`);
			if (match) {
				isCopilotTerminal = true;
			}
		});
	}

	// Additional heuristics: check if terminal has specific environment variables already set
	if (creationOptions && 'env' in creationOptions && creationOptions.env) {
		const env = creationOptions.env;
		console.log(`Creation options env variables:`, Object.keys(env));
		// Check for existing Copilot-related environment variables
		if (env['COPILOT_AGENT'] || env['GITHUB_COPILOT'] || env['AI_ASSISTANT']) {
			console.log(`✅ Found Copilot environment variables in creation options`);
			isCopilotTerminal = true;
		}
	}

	console.log(`=== FINAL DECISION: ${isCopilotTerminal ? 'COPILOT' : 'STANDARD'} ===`);

	// If this is identified as a Copilot terminal, track it
	if (isCopilotTerminal) {
		copilotTerminals.add(terminal);
		console.log(`✅ Copilot terminal detected: ${terminal.name}`);
	} else {
		console.log(`ℹ️  Standard terminal (not Copilot): ${terminal.name}`);
	}

	return isCopilotTerminal;
}

/**
 * Creates a marker file for a specific terminal's process ID
 */
function createAgentMarkerFile(terminal: vscode.Terminal) {
	const processId = terminal.processId;
	if (!processId) {
		console.warn('Cannot create marker file: terminal process ID not available yet');
		return;
	}
	
	processId.then(pid => {
		const markerPath = path.join(os.tmpdir(), `.vscode_copilot_agent_${pid}`);
		try {
			fs.writeFileSync(markerPath, JSON.stringify({
				isAgentSession: true,
				terminalMode: 'agent',
				processId: pid,
				terminalName: terminal.name,
				timestamp: Date.now()
			}));
			console.log(`Created agent marker file for PID ${pid}: ${markerPath}`);
		} catch (error) {
			console.error(`Failed to create agent marker file for PID ${pid}:`, error);
		}
	});
}

/**
 * Removes the agent marker file for a specific terminal
 */
function removeAgentMarkerFile(terminal: vscode.Terminal) {
	const processId = terminal.processId;
	if (!processId) {
		console.warn('Cannot remove marker file: terminal process ID not available');
		return;
	}
	
	processId.then(pid => {
		const markerPath = path.join(os.tmpdir(), `.vscode_copilot_agent_${pid}`);
		try {
			if (fs.existsSync(markerPath)) {
				fs.unlinkSync(markerPath);
				console.log(`Removed agent marker file for PID ${pid}: ${markerPath}`);
			}
		} catch (error) {
			console.error(`Failed to remove agent marker file for PID ${pid}:`, error);
		}
	});
}

/**
 * Removes all agent marker files (cleanup)
 */
function removeAllAgentMarkerFiles() {
	const tempDir = os.tmpdir();
	try {
		const files = fs.readdirSync(tempDir);
		const markerFiles = files.filter(f => f.startsWith('.vscode_copilot_agent_'));
		
		markerFiles.forEach(file => {
			const filePath = path.join(tempDir, file);
			try {
				fs.unlinkSync(filePath);
				console.log(`Removed agent marker file: ${filePath}`);
			} catch (error) {
				console.error(`Failed to remove marker file ${filePath}:`, error);
			}
		});
	} catch (error) {
		console.error('Failed to clean up agent marker files:', error);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Clean up marker files when extension is deactivated
	removeAllAgentMarkerFiles();
	console.log('Copilot Terminal Detection extension is being deactivated');
}
