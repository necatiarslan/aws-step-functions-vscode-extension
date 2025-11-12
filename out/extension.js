"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ui = require("./common/UI");
const StepFuncTreeView_1 = require("./step/StepFuncTreeView");
function activate(context) {
    ui.logToOutput('Aws StepFunc Extension activation started');
    let treeView = new StepFuncTreeView_1.StepFuncTreeView(context);
    vscode.commands.registerCommand('StepFuncTreeView.Refresh', () => {
        treeView.Refresh();
    });
    vscode.commands.registerCommand('StepFuncTreeView.Filter', () => {
        treeView.Filter();
    });
    vscode.commands.registerCommand('StepFuncTreeView.ShowOnlyFavorite', () => {
        treeView.ShowOnlyFavorite();
    });
    vscode.commands.registerCommand('StepFuncTreeView.ShowHiddenNodes', () => {
        treeView.ShowHiddenNodes();
    });
    vscode.commands.registerCommand('StepFuncTreeView.AddToFav', (node) => {
        treeView.AddToFav(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.DeleteFromFav', (node) => {
        treeView.DeleteFromFav(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.HideNode', (node) => {
        treeView.HideNode(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.UnHideNode', (node) => {
        treeView.UnHideNode(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.AddStepFunc', () => {
        treeView.AddStepFunc();
    });
    vscode.commands.registerCommand('StepFuncTreeView.RemoveStepFunc', (node) => {
        treeView.RemoveStepFunc(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.Goto', (node) => {
        treeView.Goto(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.SelectAwsProfile', (node) => {
        treeView.SelectAwsProfile(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.TestAwsConnection', () => {
        treeView.TestAwsConnection();
    });
    vscode.commands.registerCommand('StepFuncTreeView.UpdateAwsEndPoint', () => {
        treeView.UpdateAwsEndPoint();
    });
    vscode.commands.registerCommand('StepFuncTreeView.Donate', () => {
        treeView.Donate();
    });
    vscode.commands.registerCommand('StepFuncTreeView.BugAndNewFeature', () => {
        treeView.BugAndNewFeature();
    });
    vscode.commands.registerCommand('StepFuncTreeView.TriggerStepFunc', (node) => {
        treeView.TriggerStepFunc(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.ViewLatestLog', (node) => {
        treeView.ViewLatestLog(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.StepFuncView', (node) => {
        treeView.StepFuncView(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.PrintStepFunc', async (node) => {
        await treeView.PrintStepFunc(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.UpdateStepFuncCodes', async (node) => {
        await treeView.UpdateStepFuncCodes(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.SetCodePath', async (node) => {
        await treeView.SetCodePath(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.UnsetCodePath', async (node) => {
        await treeView.UnsetCodePath(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.OpenCodeFile', async (node) => {
        await treeView.OpenCodeFile(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.ViewCodeGraph', async (node) => {
        await treeView.ViewCodeGraph(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.ViewLog', async (node) => {
        await treeView.ViewLog(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.ViewResponsePayload', async (node) => {
        await treeView.ViewResponsePayload(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.RefreshLogs', async (node) => {
        await treeView.RefreshLogStreams(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.RefreshExecutions', async (node) => {
        await treeView.RefreshExecutions(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.RemovePayloadPath', async (node) => {
        await treeView.RemovePayloadPath(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.AddPayloadPath', async (node) => {
        await treeView.AddPayloadPath(node);
    });
    vscode.commands.registerCommand('StepFuncTreeView.ViewExecutionDetails', async (node) => {
        await treeView.ViewExecutionDetails(node);
    });
    ui.logToOutput('Aws StepFunc Extension activation completed');
}
function deactivate() {
    ui.logToOutput('Aws StepFunc is now de-active!');
}
//# sourceMappingURL=extension.js.map