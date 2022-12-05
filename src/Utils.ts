import { ImGui } from 'ml64tk';
import path from 'path';
import fs from 'fs';

export function DrawInputTextLeft(label: string, str: ImGui.stringRef, flags?: ImGui.InputTextFlags, callback?: (data: ImGui.InputTextCallbackData) => number){
    ImGui.text(label);
    ImGui.sameLine();
    return ImGui.inputText(` ###${label.trim()}`, str, flags, callback);
}

export function getFileExt(file: string){
    return path.parse(file).ext;
}

export function getFileName(file: string){
    return path.parse(file).base;
}

export function isDirectory(p: string){
    return fs.lstatSync(p).isDirectory();
}