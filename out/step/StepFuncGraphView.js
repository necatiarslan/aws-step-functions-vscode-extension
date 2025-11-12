"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepFuncGraphView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const ui = require("../common/UI");
const fs = require("fs");
class StepFuncGraphView {
    static Current;
    _panel;
    _disposables = [];
    extensionUri;
    aslDefinition;
    stepFuncName;
    constructor(panel, extensionUri, stepFuncName, aslDefinition) {
        ui.logToOutput('StepFuncGraphView.constructor Started');
        this.stepFuncName = stepFuncName;
        this.aslDefinition = aslDefinition;
        this.extensionUri = extensionUri;
        this._panel = panel;
        this._panel.onDidDispose(this.dispose, null, this._disposables);
        this.RenderHtml();
        ui.logToOutput('StepFuncGraphView.constructor Completed');
    }
    async RenderHtml() {
        ui.logToOutput('StepFuncGraphView.RenderHtml Started');
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, this.extensionUri);
        ui.logToOutput('StepFuncGraphView.RenderHtml Completed');
    }
    static async Render(extensionUri, stepFuncName, codePath) {
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
            }
            else {
                const panel = vscode.window.createWebviewPanel("StepFuncGraphView", `Step Function Graph: ${stepFuncName}`, vscode.ViewColumn.One, {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(extensionUri, 'node_modules'),
                        vscode.Uri.joinPath(extensionUri, 'media')
                    ]
                });
                StepFuncGraphView.Current = new StepFuncGraphView(panel, extensionUri, stepFuncName, aslDefinition);
            }
        }
        catch (error) {
            ui.logToOutput("StepFuncGraphView.Render Error !!!", error);
            ui.showErrorMessage('Failed to load Step Function definition', error);
        }
    }
    _getWebviewContent(webview, extensionUri) {
        ui.logToOutput('StepFuncGraphView._getWebviewContent Started');
        const styleUri = ui.getUri(webview, extensionUri, ["media", "style.css"]);
        const codiconsUri = ui.getUri(webview, extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"]);
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
        <script src="https://unpkg.com/@tshepomgaga/aws-sfn-graph@0.0.6/dist/index.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/@tshepomgaga/aws-sfn-graph@0.0.6/dist/index.css">
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
            const AWSSfnGraph = window.AWSSfnGraph.default;

            const aslData = ${aslDataJson};

            function App() {
                const [error, setError] = useState(null);

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
                        <AWSSfnGraph 
                            data={aslData} 
                            width={800} 
                            height={600} 
                            onError={handleError} 
                        />
                    </div>
                );
            }

            const root = ReactDOM.createRoot(document.getElementById('graph-container'));
            root.render(<App />);
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
    dispose() {
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
exports.StepFuncGraphView = StepFuncGraphView;
//# sourceMappingURL=StepFuncGraphView.js.map