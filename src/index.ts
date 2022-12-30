import { Application } from './Application';
import fs from 'fs-extra';
import { template } from './template';
import { Window } from './Window';
import MainWindow from './Windows/MainWindow';
import ConfigWindow from './Windows/ConfigWindow';
import GameWindow from './Windows/GameWindow';
import ModsWindow from './Windows/ModsWindow';
import { LOAD_CONFIG } from './Config';
import { register, addAsarToLookupPaths } from 'asar-node';
import ModInstallerWindow from './Windows/ModInstallerWindow';
import { DownloadModLoaderCore } from './Updater';
import DownloadingCoreWindow from './Windows/DownloadingCoreWindow';

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