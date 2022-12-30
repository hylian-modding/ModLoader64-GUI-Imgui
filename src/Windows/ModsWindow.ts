import { Gfx, ImGui, $ } from 'ml64tk';
import { Window } from "../Window";
import fs from 'fs';
import path from 'path';
import { masterConfigObject } from "../Config";
import { PakFile } from '../PakFormat';
import { arrayMoveMutable, getFileExt, getFileName, isDirectory } from '../Utils';
import { EventEmitter } from 'stream';
import AdmZip from 'adm-zip';

export const modBus: EventEmitter = new EventEmitter();

class ModEntry {

    file: string;
    meta: any;
    icon: Buffer | undefined;
    tex: Gfx.Texture | undefined;
    isEnabled: boolean[] = [false];

    constructor(file: string, meta: any, icon: Buffer | undefined) {
        this.file = file;
        this.meta = meta;
        this.icon = icon;
        this.tex = new Gfx.Texture();
        if (this.icon === undefined) {
            this.icon = fs.readFileSync(path.resolve(__dirname, "modspacer.png"));
        }
        this.tex.loadFromMemory(this.icon);
    }

    private spacer() {
        ImGui.sameLine();
        ImGui.text(" | ");
        ImGui.sameLine();
    }

    drawContents(): void {
        ImGui.separator();
        if (ImGui.arrowButton(`${this.meta.name}Up`, ImGui.Dir.Up)) {
            modBus.emit('UP', this);
        }
        ImGui.sameLine();
        if (ImGui.arrowButton(`${this.meta.name}Down`, ImGui.Dir.Down)) {
            modBus.emit('DOWN', this);
        }
        this.spacer();
        if (ImGui.checkbox(`###${this.meta.name}Enabled`, this.isEnabled)) {
            modBus.emit("SAVE", {});
        }
        this.spacer();
        if (this.icon !== undefined) {
            ImGui.image(this.tex!.id, $.xy(32, 32));
        } else {
            ImGui.text("Icon go brr");
        }
        this.spacer();
        let evt: any = { length: 0 };
        modBus.emit('SPACER', evt);
        ImGui.text(`${(this.meta.name as string).padEnd(evt.length)}`);
        this.spacer();
        ImGui.text(this.meta.version);
    }

}

class ModFolders {
    name: string;
    mods: ModEntry[] = [];
    subfolders: ModFolders[] = [];

    constructor(name: string) {
        this.name = name;
    }
}

export default class ModsWindow extends Window {

    folders: ModFolders[] = [];
    spacerLength: number = -1;

    getName(): string {
        return "Mods###ML64ModsWindow";
    }

    private getLongestModName() {
        let length = 0;

        for (let j = 0; j < this.folders.length; j++) {
            let mods = this.folders[j].mods;
            for (let i = 0; i < mods.length; i++) {
                if (mods[i].meta.name.length > length) {
                    length = mods[i].meta.name.length;
                }
            }
        }

        return length;
    }

    moveItem(folder: ModFolders, index: number, dir: ImGui.Dir) {

        let mods = folder.mods;

        if (dir === ImGui.Dir.Up && index === 0) return;
        if (dir === ImGui.Dir.Down && index === (mods.length - 1)) return;
        let itr = dir === ImGui.Dir.Up ? -1 : 1;
        let next = index + itr;
        let item = mods[next];
        let cur = mods[index];
        if (item === undefined || cur === undefined) return;
        mods[next] = cur;
        mods[index] = item;

        modBus.emit("SAVE", {});
    }

    findFolderForEntry(mod: ModEntry) {
        for (let i = 0; i < this.folders.length; i++) {
            let mods = this.folders[i].mods;
            for (let j = 0; j < mods.length; j++) {
                if (mod.meta.name === mods[j].meta.name) {
                    return this.folders[i];
                }
            }
        }
        return undefined;
    }

    onModSortUp(mod: ModEntry) {
        let folder = this.findFolderForEntry(mod)!;
        let index = -1;
        for (let i = 0; i < folder.mods.length; i++) {
            if (folder.mods[i].meta.name === mod.meta.name) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            this.moveItem(folder, index, ImGui.Dir.Up);
        }
    }

    onModSortDown(mod: ModEntry) {
        let folder = this.findFolderForEntry(mod)!;
        let index = -1;
        for (let i = 0; i < folder.mods.length; i++) {
            if (folder.mods[i].meta.name === mod.meta.name) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            this.moveItem(folder, index, ImGui.Dir.Down);
        }
    }

    onModSpacerRequest(evt: any) {
        if (this.spacerLength < 0) {
            this.spacerLength = this.getLongestModName();
        }
        evt["length"] = this.spacerLength;
    }

    readMod(f: string, folder: ModFolders) {
        if (getFileExt(f) === ".pak") {
            console.log(`Found pak ${getFileName(f)}`);
            let pak = new PakFile();
            pak.load(f);
            let meta: any = {};
            let icon: Buffer | undefined;
            for (let i = 0; i < pak.header.files.length; i++) {
                if (pak.header.files[i].filename.indexOf("node_modules") > -1) continue;
                if (pak.header.files[i].filename.indexOf("package.json") > -1) {
                    meta = JSON.parse(pak.retrieve(i).toString());
                    break;
                }
            }
            for (let i = 0; i < pak.header.files.length; i++) {
                if (pak.header.files[i].filename.indexOf("node_modules") > -1) continue;
                if (pak.header.files[i].filename.indexOf("icon.png") > -1) {
                    icon = pak.retrieve(i);
                }
            }
            folder.mods.push(new ModEntry(f, meta, icon));
        } else if (getFileExt(f) === ".asar") {
            console.log(`Found asar ${getFileName(f)}`);
            let meta: any = JSON.parse(fs.readFileSync(path.resolve(f, "package.json")).toString());
            let icon: Buffer | undefined;
            if (fs.existsSync(path.resolve(f, "icon.png"))) {
                icon = fs.readFileSync(path.resolve(f, "icon.png"));
            }
            folder.mods.push(new ModEntry(f, meta, icon));
        } else if (getFileExt(f) === ".zip") {
            let zip = new AdmZip(f);
            let meta: any;
            let icon: Buffer | undefined;
            zip.getEntries().forEach((entry: AdmZip.IZipEntry) => {
                if (meta === undefined && entry.name.indexOf("package.json") > -1) {
                    meta = JSON.parse(entry.getData().toString());
                }
                if (icon === undefined && entry.name.indexOf("icon.png") > -1) {
                    icon = entry.getData();
                }
            });
            folder.mods.push(new ModEntry(f, meta, icon));
        }
    }

    clear(): void {
        modBus.removeAllListeners();
        this.spacerLength = -1;
        this.folders.length = 0;
        console.log("Refreshing mods tab...");
        setTimeout(this.onInit.bind(this), 20);
    }

    saveLoadout() {
        let loadout: { loadOrder: any, launcherSort: { name: string, mods: string[] }[] } = { loadOrder: {}, launcherSort: [] };
        this.folders.forEach((value: ModFolders) => {
            let s: { name: string, mods: string[] } = { name: value.name, mods: [] };
            for (let i = 0; i < value.mods.length; i++) {
                loadout.loadOrder[path.parse(value.mods[i].file).base] = value.mods[i].isEnabled[0].toString();
                s.mods.push(path.parse(value.mods[i].file).base);
            }
            loadout.launcherSort.push(s);
        });
        fs.writeFileSync("./client/load_order.json", JSON.stringify(loadout, null, 2));
    }

    onInit(): void {
        let dir = "./client/mods";
        if (masterConfigObject.overrideModPath[0] !== "") {
            dir = masterConfigObject.overrideModPath[0];
        }
        this.folders.push(new ModFolders("Root"));
        let search = (dir: string, currentFolder: ModFolders) => {
            fs.readdirSync(dir).forEach((file: string) => {
                let f = path.resolve(dir, file);
                if (isDirectory(f)) {
                    let index = currentFolder.subfolders.push(new ModFolders(getFileName(f))) - 1;
                    search(f, currentFolder.subfolders[index]);
                } else {
                    this.readMod(f, currentFolder);
                }
            });
        };
        search(dir, this.folders[0]);
        let loadout: { loadOrder: any, launcherSort: { name: string, mods: string[] }[] } = { loadOrder: {}, launcherSort: [] };
        if (fs.existsSync("./client/load_order.json")) {
            loadout = JSON.parse(fs.readFileSync("./client/load_order.json").toString());
        }
        this.folders.forEach((value: ModFolders) => {
            // Set checkboxes.
            for (let i = 0; i < value.mods.length; i++) {
                if (loadout.loadOrder.hasOwnProperty(path.parse(value.mods[i].file).base)) {
                    value.mods[i].isEnabled[0] = loadout.loadOrder[path.parse(value.mods[i].file).base] === "true";
                }
            }
            // Find folders in sorted data.
            for (let i = 0; i < loadout.launcherSort.length; i++) {
                if (loadout.launcherSort[i].name === value.name) {
                    let order = loadout.launcherSort[i].mods;
                    let currentMods: string[] = [];
                    // Compare current mods to load order. Add any ones we haven't sorted.
                    for (let j = 0; j < value.mods.length; j++) {
                        let modname = path.parse(value.mods[j].file).base;
                        currentMods.push(modname);
                        if (order.indexOf(modname) === -1) {
                            order.push(modname);
                        }
                    }
                    // Remove mods from the sort that aren't installed anymore.
                    let r: string[] = [];
                    for (let j = 0; j < order.length; j++) {
                        if (currentMods.indexOf(order[j]) === -1) {
                            r.push(order[j]);
                        }
                    }
                    for (let j = 0; j < r.length; j++) {
                        order.splice(order.indexOf(r[j]), 1);
                    }
                    // Apply the sort.
                    for (let j = 0; j < order.length; j++) {
                        let index = currentMods.indexOf(order[j]);
                        arrayMoveMutable(currentMods, index, j);
                        arrayMoveMutable(value.mods, index, j);
                    }
                    break;
                }
            }
        });
        modBus.on('UP', this.onModSortUp.bind(this));
        modBus.on('DOWN', this.onModSortDown.bind(this));
        modBus.on('SPACER', this.onModSpacerRequest.bind(this));
        modBus.on('REFRESH', this.clear.bind(this));
        modBus.on('SAVE', this.saveLoadout.bind(this));
    }

    drawContents(): void {

        let subfolderHell = (sub: ModFolders) => {
            ImGui.separator();
            ImGui.setNextItemOpen(true);
            if (ImGui.treeNode(`${sub.name}###ModFolder${sub.name}`)) {
                for (let i = 0; i < sub.mods.length; i++) {
                    sub.mods[i].drawContents();
                }
                for (let i = 0; i < sub.subfolders.length; i++) {
                    subfolderHell(sub.subfolders[i]);
                }
                ImGui.treePop();
            }
        };

        for (let i = 0; i < this.folders.length; i++) {
            subfolderHell(this.folders[i]);
        }
    }

}