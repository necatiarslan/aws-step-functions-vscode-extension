"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.StepFuncTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const StepFuncTreeItem_1 = require("./StepFuncTreeItem");
const StepFuncTreeView_1 = require("./StepFuncTreeView");
class StepFuncTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    StepFuncNodeList = [];
    constructor() {
    }
    Refresh() {
        if (this.StepFuncNodeList.length === 0) {
            this.LoadStepFuncNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddStepFunc(Region, StepFunc) {
        for (var item of StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList) {
            if (item.Region === Region && item.StepFunc === StepFunc) {
                return;
            }
        }
        StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList.push({ Region: Region, StepFunc: StepFunc });
        this.AddNewStepFuncNode(Region, StepFunc);
        this.Refresh();
    }
    RemoveStepFunc(Region, StepFunc) {
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList[i].Region === Region && StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList[i].StepFunc === StepFunc) {
                StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList.splice(i, 1);
                break;
            }
        }
        this.RemoveStepFuncNode(Region, StepFunc);
        this.Refresh();
    }
    AddResponsePayload(node, payloadString) {
        let now = new Date();
        let currentTime = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0') + ':' +
            now.getSeconds().toString().padStart(2, '0');
        let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem("Response - " + currentTime, StepFuncTreeItem_1.TreeItemType.ResponsePayload);
        treeItem.Region = node.Region;
        treeItem.StepFunc = node.StepFunc;
        treeItem.ResponsePayload = payloadString;
        treeItem.Parent = node;
        node.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        node.Children.push(treeItem);
        this.Refresh();
    }
    AddLogStreams(node, LogStreams) {
        for (var streamName of LogStreams) {
            if (node.Children.find((item) => item.LogStreamName === streamName)) {
                continue;
            }
            let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem(streamName, StepFuncTreeItem_1.TreeItemType.LogStream);
            treeItem.Region = node.Region;
            treeItem.StepFunc = node.StepFunc;
            treeItem.LogStreamName = streamName;
            treeItem.Parent = node;
            node.Children.push(treeItem);
        }
        this.Refresh();
    }
    LoadStepFuncNodeList() {
        this.StepFuncNodeList = [];
        for (var item of StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList) {
            let treeItem = this.NewStepFuncNode(item.Region, item.StepFunc);
            this.StepFuncNodeList.push(treeItem);
        }
    }
    AddNewStepFuncNode(Region, StepFunc) {
        if (this.StepFuncNodeList.some(item => item.Region === Region && item.StepFunc === StepFunc)) {
            return;
        }
        let treeItem = this.NewStepFuncNode(Region, StepFunc);
        this.StepFuncNodeList.push(treeItem);
    }
    RemoveStepFuncNode(Region, StepFunc) {
        for (var i = 0; i < this.StepFuncNodeList.length; i++) {
            if (this.StepFuncNodeList[i].Region === Region && this.StepFuncNodeList[i].StepFunc === StepFunc) {
                this.StepFuncNodeList.splice(i, 1);
                break;
            }
        }
    }
    NewStepFuncNode(Region, StepFunc) {
        let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem(StepFunc, StepFuncTreeItem_1.TreeItemType.StepFunc);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.StepFunc = StepFunc;
        let codeItem = new StepFuncTreeItem_1.StepFuncTreeItem("Code", StepFuncTreeItem_1.TreeItemType.Code);
        codeItem.StepFunc = treeItem.StepFunc;
        codeItem.Region = treeItem.Region;
        codeItem.Parent = treeItem;
        codeItem.CodePath = this.GetCodePath(treeItem.Region, treeItem.StepFunc);
        treeItem.Children.push(codeItem);
        let triggerItem = new StepFuncTreeItem_1.StepFuncTreeItem("Trigger", StepFuncTreeItem_1.TreeItemType.TriggerGroup);
        triggerItem.StepFunc = treeItem.StepFunc;
        triggerItem.Region = treeItem.Region;
        triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        triggerItem.Parent = treeItem;
        treeItem.Children.push(triggerItem);
        let triggerWithPayload = new StepFuncTreeItem_1.StepFuncTreeItem("With Paylod", StepFuncTreeItem_1.TreeItemType.TriggerWithPayload);
        triggerWithPayload.StepFunc = treeItem.StepFunc;
        triggerWithPayload.Region = treeItem.Region;
        triggerWithPayload.Parent = triggerItem;
        triggerItem.Children.push(triggerWithPayload);
        let triggerWithoutPayload = new StepFuncTreeItem_1.StepFuncTreeItem("Without Paylod", StepFuncTreeItem_1.TreeItemType.TriggerNoPayload);
        triggerWithoutPayload.StepFunc = treeItem.StepFunc;
        triggerWithoutPayload.Region = treeItem.Region;
        triggerWithoutPayload.Parent = triggerItem;
        triggerItem.Children.push(triggerWithoutPayload);
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].Region === Region
                && StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].StepFunc === StepFunc) {
                this.AddNewPayloadPathNode(triggerItem, StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].PayloadPath);
            }
        }
        let logsItem = new StepFuncTreeItem_1.StepFuncTreeItem("Logs", StepFuncTreeItem_1.TreeItemType.LogGroup);
        logsItem.StepFunc = treeItem.StepFunc;
        logsItem.Region = treeItem.Region;
        logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        logsItem.Parent = treeItem;
        treeItem.Children.push(logsItem);
        return treeItem;
    }
    AddPayloadPath(node, PayloadPath) {
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].Region === node.Region
                && StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].StepFunc === node.StepFunc
                && StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].PayloadPath === PayloadPath) {
                return;
            }
        }
        this.AddNewPayloadPathNode(node, PayloadPath);
        StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.push({ Region: node.Region, StepFunc: node.StepFunc, PayloadPath: PayloadPath });
        this.Refresh();
    }
    AddNewPayloadPathNode(node, PayloadPath) {
        let fileName = PayloadPath.split("/").pop();
        if (!fileName) {
            fileName = PayloadPath;
        }
        let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem(fileName, StepFuncTreeItem_1.TreeItemType.TriggerFilePayload);
        treeItem.Region = node.Region;
        treeItem.StepFunc = node.StepFunc;
        treeItem.PayloadPath = PayloadPath;
        treeItem.Parent = node;
        node.Children.push(treeItem);
    }
    RemovePayloadPath(node) {
        if (!node.Parent) {
            return;
        }
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].Region === node.Region
                && StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].StepFunc === node.StepFunc
                && StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].PayloadPath === node.PayloadPath) {
                StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.splice(i, 1);
            }
        }
        let parentNode = node.Parent;
        for (var i = 0; i < parentNode.Children.length; i++) {
            if (parentNode.Children[i].Region === node.Region
                && parentNode.Children[i].StepFunc === node.StepFunc
                && parentNode.Children[i].PayloadPath === node.PayloadPath) {
                parentNode.Children.splice(i, 1);
            }
        }
        this.Refresh();
    }
    AddCodePath(Region, StepFunc, CodePath) {
        //remove old
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].Region === Region && StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].StepFunc === StepFunc) {
                StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.splice(i, 1);
            }
        }
        StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.push({ Region: Region, StepFunc: StepFunc, CodePath: CodePath });
        this.Refresh();
    }
    RemoveCodePath(Region, StepFunc) {
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].Region === Region && StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].StepFunc === StepFunc) {
                StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.splice(i, 1);
            }
        }
        this.Refresh();
    }
    GetCodePath(Region, StepFunc) {
        for (var item of StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList) {
            if (item.Region === Region && item.StepFunc === StepFunc) {
                return item.CodePath;
            }
        }
        return "";
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetStepFuncNodes());
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
    }
    GetStepFuncNodes() {
        var result = [];
        for (var node of this.StepFuncNodeList) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current && StepFuncTreeView_1.StepFuncTreeView.Current.FilterString && !node.IsFilterStringMatch(StepFuncTreeView_1.StepFuncTreeView.Current.FilterString)) {
                continue;
            }
            if (StepFuncTreeView_1.StepFuncTreeView.Current && StepFuncTreeView_1.StepFuncTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (StepFuncTreeView_1.StepFuncTreeView.Current && !StepFuncTreeView_1.StepFuncTreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    getTreeItem(element) {
        return element;
    }
}
exports.StepFuncTreeDataProvider = StepFuncTreeDataProvider;
var ViewType;
(function (ViewType) {
    ViewType[ViewType["StepFunc"] = 1] = "StepFunc";
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=StepFuncTreeDataProvider.js.map