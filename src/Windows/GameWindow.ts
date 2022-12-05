import { Window } from "../Window";
import { ImGui, Gui, $ } from 'ml64tk';
import { config, ConfigObject, masterConfigObject } from '../Config';
import { DrawInputTextLeft, getFileExt, getFileName } from '../Utils';
import fs from "fs";
import path from 'path';

export class GameObject {

}

export default class GameWindow extends Window {

    refs!: ConfigObject;
    current: ImGui.numberRef = [0];
    roms: string[] = [];
    supportedExt: string[] = [".z64", ".n64", ".v64", ".elf", ".dol", ".gcm", ".iso", ".tgc", ".wbfs", ".ciso", ".gcz", ".wia", ".rvz", ".wad"];
    dialogueOpen: boolean = false;
    gamePath: string = "";

    onInit(): void {
        this.refs = masterConfigObject;
        this.gamePath = "./client/roms";
        if (this.refs.overrideRomPath[0] !== "") {
            this.gamePath = this.refs.overrideRomPath[0];
        }
        this.refreshGameList(this.gamePath);
    }

    refreshGameList(path: string) {
        this.roms.length = 0;
        let contents: string[] = fs.readdirSync(path);
        for (let i = 0; i < contents.length; i++) {
            if (this.supportedExt.indexOf(getFileExt(contents[i])) > -1) {
                this.roms.push(contents[i])
            }
        }
    }

    getName(): string {
        return "Games###ML64gameWindow"
    }

    drawContents(): void {
        if (ImGui.button("Select Games Folder")) {
            let r = Gui.getExistingDirectory({ parent: ImGui.getMainViewport(), title: "", currentFolder: path.resolve("./client/roms") });
            if (r !== undefined) {
                this.refs.overrideRomPath[0] = r;
                this.gamePath = this.refs.overrideRomPath[0];
                this.refs.update();
                this.refreshGameList(this.gamePath);
            }
        }
        ImGui.sameLine();
        if (ImGui.button("Refresh Games List")) {
            this.refreshGameList(this.gamePath);
        }

        ImGui.separator();
        for (let i = 0; i < this.roms.length; i++) {
            if (ImGui.checkbox(this.roms[i], [config.ModLoader64.rom === this.roms[i]])) {
                config.ModLoader64.rom = this.roms[i];
            }
        }
        ImGui.separator();
        if (ImGui.button("Save")) {
            this.refs.update();
        }
    }
}