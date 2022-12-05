import { Application } from './Application';
import fs from 'fs';
import { template } from './template';
import { Window } from './Window';
import MainWindow from './Windows/MainWindow';
import ConfigWindow from './Windows/ConfigWindow';
import GameWindow from './Windows/GameWindow';
import ModsWindow from './Windows/ModsWindow';
import { LOAD_CONFIG } from './Config';
import { register, addAsarToLookupPaths } from 'asar-node';


register();
addAsarToLookupPaths();
LOAD_CONFIG();

export default class GUI extends Application {

    windows: Window[] = [];

    onInit(): void {
    }

    makeWindows() {
        this.addWindow(new MainWindow());
        this.addWindow(new GameWindow());
        this.addWindow(new ModsWindow());
        this.addWindow(new ConfigWindow());
    }

    onNewFrame(): void {
        for (let i = 0; i < this.windows.length; i++) {
            this.windows[i].startDraw();
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

if (!fs.existsSync("./userSettings.json")) {
    fs.writeFileSync("./userSettings.json", template);
}

let app = new GUI("ModLoader64-gui");
app.run();
setTimeout(app.makeWindows.bind(app), 1000);