import { get } from 'http';
import ollama from 'ollama'; // FIXED import
import { Stream } from 'stream';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "chexx-deepseek-ext" is now active!');

	const disposable = vscode.commands.registerCommand('chexx-deepseek-ext.deepInit', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
			"Deep Seek Chat",
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let responseText = '';

				try {
					const streamResponse = await ollama.chat({ // FIXED usage of `ollama`
						model: 'deepseek-r1:latest',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true
					});

					for await (const part of streamResponse) {
						responseText += part.message.content; // FIXED concatenation
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}

				} catch (err) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: An error occurred while loading the model.` });
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

function getWebviewContent(): string {
	return /*html*/`
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<style>
			body { font-family: sans-serif; margin: 1rem; }
			#prompt { width: 100%; box-sizing: border-box; }
			#response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; min-height: 0.5rem; } /* FIXED border */
		</style>
	</head>
	<body>
		<h2>Deep VS Code Extension</h2>
		<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea><br />
		<button id="askBtn">Ask</button>
		<div id="response"></div>
		
		<script>
			const vscode = acquireVsCodeApi();

			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				vscode.postMessage({ command: 'chat', text });
			});

			window.addEventListener("message", event => {
				const { command, text } = event.data;
				if (command === 'chatResponse') {
					document.getElementById('response').innerText = text;
				}
			});
		</script>
	</body>
	</html>
	`;
}
