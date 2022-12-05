import { Window } from "../Window";
import { ImGui } from 'ml64tk';
import { config, masterConfigObject, SAVE_CONFIG } from '../Config';
import { DrawInputTextLeft } from '../Utils';
import BootML from '../BootML';

export default class MainWindow extends Window {

    get consoleList(): string[] {
        return config.ModLoader64.supportedConsoles;
    }

    get console(): string {
        return config.ModLoader64.selectedConsole;
    }

    set console(s: string) {
        config.ModLoader64.selectedConsole = s;
        SAVE_CONFIG();
    }

    onInit(): void {
    }

    getName(): string {
        return "Main###ML64MainWindow"
    }

    drawContents(): void {
        if (DrawInputTextLeft("Nickname", masterConfigObject.nickname)) { }
        ImGui.sameLine();
        if (ImGui.beginCombo("Consoles", this.console, ImGui.ComboFlags.NoPreview)) {
            for (let i = 0; i < this.consoleList.length; i++) {
                if (ImGui.selectable(this.consoleList[i], (this.console === this.consoleList[i]))) {
                    this.console = this.consoleList[i];
                }
            }
            ImGui.endCombo();
        }
        ImGui.sameLine();
        if(this.console === "Dolphin") {
            if(ImGui.button("Configure Dolphin")){
                
            }
        }
        else ImGui.newLine();
        if (DrawInputTextLeft("Lobby   ", masterConfigObject.lobby)) { }
        ImGui.sameLine();
        ImGui.text(`Selected Console: ${this.console}`);
        if (DrawInputTextLeft("Password", masterConfigObject.password, ImGui.InputTextFlags.Password)) { }
        ImGui.separator();
        if (ImGui.button("Start")) {
            BootML.start();
        }
    }

}