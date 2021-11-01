/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { parseMarkdown, writeCellsToMarkdown, RawNotebookCell } from './markdownParser';

const providerOptions = {
	transientMetadata: {
		runnable: true,
		editable: true,
		custom: true,
	},
	transientOutputs: true
};

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(new Controller());
	context.subscriptions.push(vscode.workspace.registerNotebookSerializer('notepad', new MarkdownProvider(), providerOptions));
}

// there are globals in workers and nodejs
declare class TextDecoder {
	decode(data: Uint8Array): string;
}
declare class TextEncoder {
	encode(data: string): Uint8Array;
}

class MarkdownProvider implements vscode.NotebookSerializer {

	private readonly decoder = new TextDecoder();
	private readonly encoder = new TextEncoder();

	deserializeNotebook(data: Uint8Array, _token: vscode.CancellationToken): vscode.NotebookData | Thenable<vscode.NotebookData> {
		const content = this.decoder.decode(data);

		const cellRawData = parseMarkdown(content);
		const cells = cellRawData.map(rawToNotebookCellData);

		return {
			cells
		};
	}

	serializeNotebook(data: vscode.NotebookData, _token: vscode.CancellationToken): Uint8Array | Thenable<Uint8Array> {
		const stringOutput = writeCellsToMarkdown(data.cells);
		return this.encoder.encode(stringOutput);
	}
}

export function rawToNotebookCellData(data: RawNotebookCell): vscode.NotebookCellData {
	return <vscode.NotebookCellData>{
		kind: data.kind,
		languageId: data.language,
		metadata: { leadingWhitespace: data.leadingWhitespace, trailingWhitespace: data.trailingWhitespace, indentation: data.indentation },
		outputs: [],
		value: data.content
	};
}

export function deactivate() { }

class Controller {
	readonly controllerId = 'notepad-controller';
	readonly notebookType = 'notepad';
	readonly label = 'Notepad';
	readonly supportedLanguages = ['graph-spec'];
  
	private readonly _controller: vscode.NotebookController;
	private _executionOrder = 0;
  
	constructor() {
	  this._controller = vscode.notebooks.createNotebookController(
		this.controllerId,
		this.notebookType,
		this.label
	  );
  
	  this._controller.supportedLanguages = this.supportedLanguages;
	  this._controller.supportsExecutionOrder = true;
	  this._controller.executeHandler = this._execute.bind(this);
	}

	dispose(): void {
		this._controller.dispose();
	}
  
	private _execute(
	  cells: vscode.NotebookCell[],
	  _notebook: vscode.NotebookDocument,
	  _controller: vscode.NotebookController
	): void {
	  for (let cell of cells) {
		this._doExecution(cell);
	  }
	}
  
	private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
	  const execution = this._controller.createNotebookCellExecution(cell);
	  execution.executionOrder = ++this._executionOrder;
	  execution.start(Date.now()); // Keep track of elapsed time to execute cell.
  
	  /* Do some execution here; not implemented */
  
	  execution.replaceOutput([
		new vscode.NotebookCellOutput([
		  vscode.NotebookCellOutputItem.text(cell.document.getText(),'x-application/grapher')
		])
	  ]);
	  execution.end(true, Date.now());
	}
  }

const ALL_LANGUAGES = [
	'plaintext',
	'bat',
	'clojure',
	'coffeescript',
	'jsonc',
	'c',
	'cpp',
	'csharp',
	'css',
	'dockerfile',
	'ignore',
	'fsharp',
	'diff',
	'go',
	'groovy',
	'handlebars',
	'hlsl',
	'html',
	'ini',
	'properties',
	'java',
	'javascriptreact',
	'javascript',
	'jsx-tags',
	'json',
	'less',
	'lua',
	'makefile',
	'markdown',
	'objective-c',
	'objective-cpp',
	'perl',
	'perl6',
	'php',
	'powershell',
	'jade',
	'python',
	'r',
	'razor',
	'ruby',
	'rust',
	'scss',
	'search-result',
	'shaderlab',
	'shellscript',
	'sql',
	'swift',
	'typescript',
	'typescriptreact',
	'vb',
	'xml',
	'xsl',
	'yaml',
	'github-issues',
	'graph-spec'
];
