"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.GetCredentials = GetCredentials;
exports.GetLambdaList = GetLambdaList;
exports.isJsonString = isJsonString;
exports.ParseJson = ParseJson;
exports.TriggerLambda = TriggerLambda;
exports.GetLatestLambdaLogStreamName = GetLatestLambdaLogStreamName;
exports.GetLambdaLogGroupName = GetLambdaLogGroupName;
exports.GetLatestLambdaLogs = GetLatestLambdaLogs;
exports.GetLatestLambdaLogStreams = GetLatestLambdaLogStreams;
exports.GetLambdaLogs = GetLambdaLogs;
exports.GetLogEvents = GetLogEvents;
exports.GetLambda = GetLambda;
exports.GetLambdaConfiguration = GetLambdaConfiguration;
exports.UpdateLambdaCode = UpdateLambdaCode;
exports.ZipTextFile = ZipTextFile;
exports.TestAwsCredentials = TestAwsCredentials;
exports.TestAwsConnection = TestAwsConnection;
exports.GetAwsProfileList = GetAwsProfileList;
exports.getIniProfileData = getIniProfileData;
/* eslint-disable @typescript-eslint/naming-convention */
const credential_providers_1 = require("@aws-sdk/credential-providers");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const client_iam_1 = require("@aws-sdk/client-iam");
const ui = require("./UI");
const MethodResult_1 = require("./MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../aws-sdk/parseKnownFiles");
const LambdaTreeView = require("../lambda/LambdaTreeView");
const fs = require("fs");
const archiver = require("archiver");
async function GetCredentials() {
    let credentials;
    try {
        if (LambdaTreeView.LambdaTreeView.Current) {
            process.env.AWS_PROFILE = LambdaTreeView.LambdaTreeView.Current.AwsProfile;
        }
        // Get credentials using the default provider chain.
        const provider = (0, credential_providers_1.fromNodeProviderChain)({ ignoreCache: true });
        credentials = await provider();
        if (!credentials) {
            throw new Error("Aws credentials not found !!!");
        }
        ui.logToOutput("Aws credentials AccessKeyId=" + credentials.accessKeyId);
        return credentials;
    }
    catch (error) {
        ui.showErrorMessage("Aws Credentials Not Found !!!", error);
        ui.logToOutput("GetCredentials Error !!!", error);
        return credentials;
    }
}
async function GetLambdaClient(region) {
    const credentials = await GetCredentials();
    const lambdaClient = new client_lambda_1.LambdaClient({
        region,
        credentials,
        endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint,
    });
    return lambdaClient;
}
async function GetCloudWatchClient(region) {
    const credentials = await GetCredentials();
    const cloudwatchLogsClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
        region,
        credentials,
        endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint,
    });
    return cloudwatchLogsClient;
}
async function GetIAMClient() {
    const credentials = await GetCredentials();
    const iamClient = new client_iam_1.IAMClient({ credentials });
    return iamClient;
}
async function GetLambdaList(region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the Lambda client (v3 client)
        const lambda = await GetLambdaClient(region);
        let allFunctions = [];
        let marker = undefined;
        // Continue fetching pages until no NextMarker is returned
        do {
            const command = new client_lambda_1.ListFunctionsCommand({ Marker: marker });
            const functionsList = await lambda.send(command);
            if (functionsList.Functions) {
                allFunctions.push(...functionsList.Functions);
            }
            // Update marker to the next page (if present)
            marker = functionsList.NextMarker;
        } while (marker);
        // Filter functions if a LambdaName filter is provided
        let matchingFunctions;
        if (LambdaName) {
            matchingFunctions = allFunctions.filter((func) => func.FunctionName?.includes(LambdaName) || LambdaName.length === 0);
        }
        else {
            matchingFunctions = allFunctions;
        }
        // Extract the function names into the result
        if (matchingFunctions && matchingFunctions.length > 0) {
            matchingFunctions.forEach((func) => {
                if (func.FunctionName)
                    result.result.push(func.FunctionName);
            });
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambdaList Error !!!", error);
        ui.logToOutput("api.GetLambdaList Error !!!", error);
        return result;
    }
}
const client_lambda_2 = require("@aws-sdk/client-lambda");
function isJsonString(jsonString) {
    try {
        var json = ParseJson(jsonString);
        return (typeof json === 'object');
    }
    catch (e) {
        return false;
    }
}
function ParseJson(jsonString) {
    return JSON.parse(jsonString);
}
async function TriggerLambda(Region, LambdaName, Parameters) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        // Specify the parameters for invoking the Lambda function
        const param = {
            FunctionName: LambdaName,
            // Explicitly cast the literal so that its type is the exact union type expected
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(Parameters),
        };
        const command = new client_lambda_2.InvokeCommand(param);
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.TriggerLambda Error !!!", error);
        ui.logToOutput("api.TriggerLambda Error !!!", error);
        return result;
    }
}
const client_cloudwatch_logs_2 = require("@aws-sdk/client-cloudwatch-logs");
async function GetLatestLambdaLogStreamName(Region, Lambda) {
    ui.logToOutput("GetLatestLambdaLogStreamName for Lambda function: " + Lambda);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetLambdaLogGroupName(Lambda);
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_2.DescribeLogStreamsCommand({
            logGroupName,
            orderBy: "LastEventTime",
            descending: true,
            limit: 1,
        });
        const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
        if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log streams found for this Lambda function.");
            ui.showErrorMessage("No log streams found for this Lambda function.", result.error);
            ui.logToOutput("No log streams found for this Lambda function.");
            return result;
        }
        // Get the latest log events from the first stream
        const logStreamName = streamsResponse.logStreams[0].logStreamName;
        if (!logStreamName) {
            result.isSuccessful = false;
            result.error = new Error("No log stream name found for this Lambda function.");
            ui.showErrorMessage("No log stream name found for this Lambda function.", result.error);
            ui.logToOutput("No log stream name found for this Lambda function.");
            return result;
        }
        result.result = logStreamName;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestLambdaLogStreamName Error !!!", error);
        ui.logToOutput("api.GetLatestLambdaLogStreamName Error !!!", error);
        return result;
    }
}
function GetLambdaLogGroupName(Lambda) {
    return `/aws/lambda/${Lambda}`;
}
async function GetLatestLambdaLogs(Region, Lambda) {
    ui.logToOutput("Getting logs for Lambda function: " + Lambda);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetLambdaLogGroupName(Lambda);
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_2.DescribeLogStreamsCommand({
            logGroupName,
            orderBy: "LastEventTime",
            descending: true,
            limit: 1,
        });
        const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
        if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log streams found for this Lambda function.");
            ui.showErrorMessage("No log streams found for this Lambda function.", result.error);
            ui.logToOutput("No log streams found for this Lambda function.");
            return result;
        }
        // Get the latest log events from the first stream
        const logStreamName = streamsResponse.logStreams[0].logStreamName;
        if (!logStreamName) {
            result.isSuccessful = false;
            result.error = new Error("No log stream name found for this Lambda function.");
            ui.showErrorMessage("No log stream name found for this Lambda function.", result.error);
            ui.logToOutput("No log stream name found for this Lambda function.");
            return result;
        }
        const getLogEventsCommand = new client_cloudwatch_logs_2.GetLogEventsCommand({
            logGroupName: logGroupName,
            logStreamName: logStreamName,
            limit: 50, // Adjust the limit as needed
            startFromHead: true, // Start from the beginning of the log stream
        });
        const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
        if (!eventsResponse.events || eventsResponse.events.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log events found for this Lambda function.");
            ui.showErrorMessage("No log events found for this Lambda function.", result.error);
            ui.logToOutput("No log events found for this Lambda function.");
            return result;
        }
        // Concatenate log messages
        result.result = eventsResponse.events
            .map((event) => event.message)
            .filter((msg) => msg)
            .join("\n");
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestLambdaLogs Error !!!", error);
        ui.logToOutput("api.GetLatestLambdaLogs Error !!!", error);
        return result;
    }
}
async function GetLatestLambdaLogStreams(Region, Lambda) {
    ui.logToOutput("Getting log streams for Lambda function: " + Lambda);
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the log group name
        const logGroupName = GetLambdaLogGroupName(Lambda);
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_2.DescribeLogStreamsCommand({
            logGroupName,
            orderBy: "LastEventTime",
            descending: true,
            limit: 1,
        });
        const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
        if (streamsResponse.logStreams && streamsResponse.logStreams.length > 0) {
            let logStreamNames = streamsResponse.logStreams.slice(0, 10).map(stream => stream.logStreamName || 'invalid log stream');
            result.result = logStreamNames;
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestLambdaLogStreams Error !!!", error);
        ui.logToOutput("api.GetLatestLambdaLogStreams Error !!!", error);
        return result;
    }
}
async function GetLambdaLogs(Region, Lambda, LogStreamName) {
    ui.logToOutput("Getting logs for Lambda function: " + Lambda + " LogStream " + LogStreamName);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetLambdaLogGroupName(Lambda);
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        const getLogEventsCommand = new client_cloudwatch_logs_2.GetLogEventsCommand({
            logGroupName: logGroupName,
            logStreamName: LogStreamName,
            limit: 50, // Adjust the limit as needed
            startFromHead: true, // Start from the beginning of the log stream
        });
        const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
        if (!eventsResponse.events || eventsResponse.events.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log events found for this Lambda function." + Lambda + " LogStream " + LogStreamName);
            ui.showErrorMessage("No log events found for this Lambda function." + Lambda + " LogStream " + LogStreamName, result.error);
            ui.logToOutput("No log events found for this Lambda function." + Lambda + " LogStream " + LogStreamName);
            return result;
        }
        // Concatenate log messages
        result.result = eventsResponse.events
            .map((event) => event.message)
            .filter((msg) => msg)
            .join("\n");
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestLambdaLogs Error !!!", error);
        ui.logToOutput("api.GetLatestLambdaLogs Error !!!", error);
        return result;
    }
}
async function GetLogEvents(Region, LogGroupName, LogStreamName) {
    ui.logToOutput("Getting logs from LogGroupName: " + LogGroupName + " LogStreamName: " + LogStreamName);
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the log group name
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        const getLogEventsCommand = new client_cloudwatch_logs_2.GetLogEventsCommand({
            logGroupName: LogGroupName,
            logStreamName: LogStreamName,
            limit: 50, // Adjust the limit as needed
            startFromHead: true, // Start from the beginning of the log stream
        });
        const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
        if (!eventsResponse.events || eventsResponse.events.length === 0) {
            result.isSuccessful = true;
            return result;
        }
        // Concatenate log messages
        result.result.push(...eventsResponse.events);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLogEvents Error !!!", error);
        ui.logToOutput("api.GetLogEvents Error !!!", error);
        return result;
    }
}
const client_lambda_3 = require("@aws-sdk/client-lambda");
async function GetLambda(Region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        const command = new client_lambda_3.GetFunctionCommand({
            FunctionName: LambdaName,
        });
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambda Error !!!", error);
        ui.logToOutput("api.GetLambda Error !!!", error);
        return result;
    }
}
const client_lambda_4 = require("@aws-sdk/client-lambda");
async function GetLambdaConfiguration(Region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        const command = new client_lambda_4.GetFunctionConfigurationCommand({
            FunctionName: LambdaName,
        });
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambdaConfiguration Error !!!", error);
        ui.logToOutput("api.GetLambdaConfiguration Error !!!", error);
        return result;
    }
}
const client_lambda_5 = require("@aws-sdk/client-lambda");
async function UpdateLambdaCode(Region, LambdaName, CodeFilePath) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        let zipresponse = await ZipTextFile(CodeFilePath);
        //wait for the zip file to be created
        while (!fs.existsSync(zipresponse.result)) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const zipFileContents = fs.readFileSync(zipresponse.result);
        const command = new client_lambda_5.UpdateFunctionCodeCommand({
            FunctionName: LambdaName,
            ZipFile: zipFileContents,
        });
        const response = await lambda.send(command);
        // Delete the zip file
        fs.unlinkSync(zipresponse.result);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateLambdaCode Error !!!", error);
        ui.logToOutput("api.UpdateLambdaCode Error !!!", error);
        return result;
    }
}
async function ZipTextFile(inputPath, outputZipPath) {
    let result = new MethodResult_1.MethodResult();
    try {
        if (!outputZipPath) {
            outputZipPath = (0, path_2.dirname)(inputPath) + "/" + (0, path_2.basename)(inputPath) + ".zip";
        }
        // Delete the output zip file if it already exists
        if (fs.existsSync(outputZipPath)) {
            fs.unlinkSync(outputZipPath);
        }
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Set compression level
        });
        archive.pipe(output);
        if (fs.lstatSync(inputPath).isDirectory()) {
            archive.directory(inputPath, false);
        }
        else {
            archive.file(inputPath, { name: (0, path_2.basename)(inputPath) });
        }
        archive.finalize();
        result.result = outputZipPath;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.ZipTextFile Error !!!', error);
        ui.logToOutput("api.ZipTextFile Error !!!", error);
        return result;
    }
}
const client_sts_1 = require("@aws-sdk/client-sts");
async function GetSTSClient(region) {
    const credentials = await GetCredentials();
    const iamClient = new client_sts_1.STSClient({
        region,
        credentials,
        endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint,
    });
    return iamClient;
}
async function TestAwsCredentials() {
    let result = new MethodResult_1.MethodResult();
    try {
        const credentials = await GetCredentials();
        result.isSuccessful = true;
        result.result = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
async function TestAwsConnection(Region = "us-east-1") {
    let result = new MethodResult_1.MethodResult();
    try {
        const sts = await GetSTSClient(Region);
        const command = new client_sts_1.GetCallerIdentityCommand({});
        const data = await sts.send(command);
        result.isSuccessful = true;
        result.result = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
async function GetAwsProfileList() {
    ui.logToOutput("api.GetAwsProfileList Started");
    let result = new MethodResult_1.MethodResult();
    try {
        let profileData = await getIniProfileData();
        result.result = Object.keys(profileData);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.GetAwsProfileList Error !!!', error);
        ui.logToOutput("api.GetAwsProfileList Error !!!", error);
        return result;
    }
}
async function getIniProfileData(init = {}) {
    const profiles = await (0, parseKnownFiles_1.parseKnownFiles)(init);
    return profiles;
}
exports.ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const getHomeDir = () => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${path_1.sep}` } = process.env;
    if (HOME) {
        return HOME;
    }
    if (USERPROFILE) {
        return USERPROFILE;
    }
    if (HOMEPATH) {
        return `${HOMEDRIVE}${HOMEPATH}`;
    }
    return (0, os_1.homedir)();
};
exports.getHomeDir = getHomeDir;
const getCredentialsFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "credentials");
exports.getCredentialsFilepath = getCredentialsFilepath;
const getConfigFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "config");
exports.getConfigFilepath = getConfigFilepath;
//# sourceMappingURL=API.js.map