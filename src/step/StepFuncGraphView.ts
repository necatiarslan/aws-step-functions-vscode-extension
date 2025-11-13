/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as ui from '../common/UI';
import * as fs from 'fs';

export class StepFuncGraphView {
    public static Current: StepFuncGraphView | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private extensionUri: vscode.Uri;
    private aslDefinition: any;
    private stepFuncName: string;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, stepFuncName: string, aslDefinition: any) {
        ui.logToOutput('StepFuncGraphView.constructor Started');

        this.stepFuncName = stepFuncName;
        this.aslDefinition = aslDefinition;
        this.extensionUri = extensionUri;

        this._panel = panel;
        this._panel.onDidDispose(this.dispose, null, this._disposables);
        this.RenderHtml();
        ui.logToOutput('StepFuncGraphView.constructor Completed');
    }

    public async RenderHtml() {
        ui.logToOutput('StepFuncGraphView.RenderHtml Started');
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, this.extensionUri);
        ui.logToOutput('StepFuncGraphView.RenderHtml Completed');
    }

    public static async Render(extensionUri: vscode.Uri, stepFuncName: string, codePath: string) {
        ui.logToOutput('StepFuncGraphView.Render Started');
        
        try {
            // Read the ASL JSON file
            const fileContent = fs.readFileSync(codePath, 'utf8');
            const aslDefinition = JSON.parse(fileContent);

            if (StepFuncGraphView.Current) {
                StepFuncGraphView.Current.stepFuncName = stepFuncName;
                StepFuncGraphView.Current.aslDefinition = aslDefinition;
                StepFuncGraphView.Current.RenderHtml();
                StepFuncGraphView.Current._panel.reveal(vscode.ViewColumn.One);
            } else {
                const panel = vscode.window.createWebviewPanel(
                    "StepFuncGraphView", 
                    `Step Function Graph: ${stepFuncName}`, 
                    vscode.ViewColumn.One, 
                    {
                        enableScripts: true,
                        localResourceRoots: [
                            vscode.Uri.joinPath(extensionUri, 'node_modules'),
                            vscode.Uri.joinPath(extensionUri, 'media')
                        ]
                    }
                );

                StepFuncGraphView.Current = new StepFuncGraphView(panel, extensionUri, stepFuncName, aslDefinition);
            }
        } catch (error: any) {
            ui.logToOutput("StepFuncGraphView.Render Error !!!", error);
            ui.showErrorMessage('Failed to load Step Function definition', error);
        }
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        ui.logToOutput('StepFuncGraphView._getWebviewContent Started');

        // Use webview.asWebviewUri for local files so the webview can resolve them.
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "style.css"));
        // Load codicons from CDN to avoid file:// resolution issues for node_modules assets.
        const codiconsUri = "https://unpkg.com/@vscode/codicons@0.0.26/dist/codicon.css";
        
        // Load AWSSfnGraph library locally instead of from CDN
        const awsSfnGraphJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "node_modules", "@tshepomgaga", "aws-sfn-graph", "index.js"));
        const awsSfnGraphCssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "node_modules", "@tshepomgaga", "aws-sfn-graph", "index.css"));

        // Escape the JSON for use in JavaScript
        const aslDataJson = JSON.stringify(this.aslDefinition);

        let result = /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	  <head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width,initial-scale=1.0">
		<link rel="stylesheet" href="${styleUri}">
		<link href="${codiconsUri}" rel="stylesheet" id="vscode-codicon-stylesheet"/>
		<title>Step Function Graph</title>
		<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
		<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
		<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
		<script src="${awsSfnGraphJsUri}"></script>
		<link rel="stylesheet" href="${awsSfnGraphCssUri}">
		<style>
			body {
				padding: 20px;
				overflow: auto;
			}
			#graph-container {
				width: 100%;
				height: calc(100vh - 100px);
				min-height: 500px;
				display: flex;
				justify-content: center;
				align-items: center;
			}
			h2 {
				margin-bottom: 20px;
			}
		</style>
	  </head>
	  <body>  
		<h2>Step Function: ${this.stepFuncName}</h2>
		<div id="graph-container"></div>

		<script type="text/babel">
			const { useState, useEffect } = React;
			// Try both possible export shapes: direct or .default
			const AWSSfnGraph = (window.AWSSfnGraph && (window.AWSSfnGraph.default || window.AWSSfnGraph)) || null;

			const aslData = ${aslDataJson};

			function App() {
				const [error, setError] = useState(null);

				useEffect(() => {
					// If the library failed to load, set an explicit error instead of crashing
					if (!AWSSfnGraph) {
						setError("AWSSfnGraph library failed to load. Check network/CDN availability.");
					}
				}, []);

				const handleError = (err) => {
					console.error('Graph rendering error:', err);
					setError(err?.message || 'Unknown error occurred');
				};

				return (
					<div style={{ width: '100%', height: '100%' }}>
						{error && (
							<div style={{ color: 'var(--vscode-errorForeground)', padding: '10px', marginBottom: '10px' }}>
								Error rendering graph: {error}
							</div>
						)}
						{!error && AWSSfnGraph && (
							<AWSSfnGraph 
								data={aslData} 
								width="100%" 
								height="100%" 
								onError={handleError} 
							/>
						)}
					</div>
				);
			}

			try {
				const root = ReactDOM.createRoot(document.getElementById('graph-container'));
				root.render(<App />);
			} catch (e) {
				console.error('Render failed:', e);
				const container = document.getElementById('graph-container');
				if (container) {
					container.innerHTML = '<div style="color:var(--vscode-errorForeground);padding:10px;">Failed to initialize graph renderer. Check console for details.</div>';
				}
			}
		</script>

		<br>
		<br>
		<table>
			<tr>
				<td>
					<a href="https://github.com/necatiarslan/aws-step-functions-vscode-extension/issues/new">Bug Report & Feature Request</a>
				</td>
			</tr>
		</table>
	  </body>
	</html>
	`;
        ui.logToOutput('StepFuncGraphView._getWebviewContent Completed');
        return result;
    }

    public dispose() {
        ui.logToOutput('StepFuncGraphView.dispose Started');
        StepFuncGraphView.Current = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
