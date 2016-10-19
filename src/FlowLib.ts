/// <reference path="./cross-spawn.d.ts" />
import { spawn } from 'cross-spawn';
import * as vscode from 'vscode';
import { determineFlowPath, checkFlow, checkNode } from './utils';
import * as path from 'path';

let pathToFlow = '';

const getPathToFlow = () => {
    if (pathToFlow) {
        return pathToFlow;
    }
    pathToFlow = determineFlowPath();
    checkNode();
    checkFlow();
    return pathToFlow;
};

export default class FlowLib {
    static execFlow(fileContents, filename, args) {
        return new Promise((resolve, reject) => {
            // console.log('Fetching data for %s, %s, %s', fileName, pos.line, pos.character);
            const cwd = path.dirname(filename);
            let flowOutput = "";
			let flowOutputError = "";
            const flowProc = spawn(getPathToFlow(), args, { cwd: cwd });
            flowProc.stdout.on('data', (data) => {
               flowOutput += data.toString();
            });
            flowProc.stderr.on('data', (data) => {
                flowOutputError += data.toString();
            });
            flowProc.on('exit', () => {
                if (flowOutputError) {
                    reject(flowOutputError);
                } else {
                    resolve(JSON.parse(flowOutput));
                }
            });
            flowProc.stdin.write(fileContents);
            flowProc.stdin.end();
        });
    }
    static getTypeAtPos(fileContents, fileName, pos: vscode.Position) {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,  
                    ['type-at-pos', '--json', '--pretty', '--path', fileName, pos.line + 1, pos.character + 1]);
    }
    static getDiagnostics(fileContents: string, fileName: string): any {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,  
                    ['status', '--json']);
    }
    static getAutocomplete(fileContents: string, fileName: string, pos: vscode.Position): any {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,  
                    ['autocomplete', '--json', fileName, pos.line + 1, pos.character + 1]);
    }
     static getCoverage(fileContents: string, fileName: string): any {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,
                    ['coverage', '--json', fileName]);
    }
}