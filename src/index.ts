import { addAsarToLookupPaths, register } from 'asar-node';
import fs from 'fs-extra';
import { Application } from './Application';
import { LOAD_CONFIG } from './Config';
import { DownloadModLoaderCore } from './Updater';
import { Window } from './Window';
import ConfigWindow from './Windows/ConfigWindow';
import DownloadingCoreWindow from './Windows/DownloadingCoreWindow';
import GameWindow from './Windows/GameWindow';
import MainWindow from './Windows/MainWindow';
import ModInstallerWindow from './Windows/ModInstallerWindow';
import ModsWindow from './Windows/ModsWindow';
import { template } from './template';

register();
addAsarToLookupPaths();

if (!fs.existsSync("./userSettings.json")) {
    fs.writeFileSync("./userSettings.json", template);
}

let needCoreDownload: boolean = false;
const updateWindow: DownloadingCoreWindow = new DownloadingCoreWindow();

export function setCoreDownloadComplete(){
    needCoreDownload = false;
}

export function setCoreDownloadStarted(id: string){
    needCoreDownload = true;
    updateWindow.name = id;
}

if (!fs.existsSync("./client")){
    fs.mkdirSync("./client");
    fs.mkdirSync("./client/roms");
    fs.mkdirSync("./client/mods");
}

LOAD_CONFIG();

DownloadModLoaderCore.checkForUpdate();

export default class GUI extends Application {

    windows: Window[] = [];

    onInit(): void {
    }

    makeWindows() {
        this.addWindow(new MainWindow());
        this.addWindow(new GameWindow());
        this.addWindow(new ModsWindow());
        this.addWindow(new ModInstallerWindow());
        this.addWindow(new ConfigWindow());
    }

    onNewFrame(): void {
        if (!needCoreDownload){
            for (let i = 0; i < this.windows.length; i++) {
                this.windows[i].startDraw();
            }
        }else{
            updateWindow.startDraw();
        }
    }

    addWindow(w: Window) {
        console.log(`init ${w.getName()}`);
        w.onInit();
        this.windows.push(w);
    }

    removeWindow(w: Window) {
        let r = -1;
        for (let i = 0; i < this.windows.length; i++) {
            if (this.windows[i].getName() === w.getName()) {
                r = i;
                break;
            }
        }
        if (r > -1) {
            this.windows.splice(r, 1);
        }
    }

}

let app = new GUI("ModLoader64-gui");
app.run();

setTimeout(app.makeWindows.bind(app), 1);