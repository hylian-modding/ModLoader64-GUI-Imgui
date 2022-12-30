import { ImGui } from "ml64tk";
import { Window } from "../Window";

export default class DownloadingCoreWindow extends Window{

    name: string = "";

    getName(): string {
        return "Updating"
    }

    onInit(): void {
    }

    drawContents(): void {
        ImGui.text(`Updating ${this.name}...`);
        ImGui.text("The application may freeze temporarily during this process.");
    }
    
}