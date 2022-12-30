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
    return fs.lstatSync(p).isDirectory() && p.indexOf(".asar") === -1;
}

export function arrayMoveMutable(array: any[], fromIndex: number, toIndex: number) {
	const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

	if (startIndex >= 0 && startIndex < array.length) {
		const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

		const [item] = array.splice(fromIndex, 1);
		array.splice(endIndex, 0, item);
	}
}

export function arrayMoveImmutable(array: any[], fromIndex: number, toIndex: number) {
	const newArray = [...array];
	arrayMoveMutable(newArray, fromIndex, toIndex);
	return newArray;
}