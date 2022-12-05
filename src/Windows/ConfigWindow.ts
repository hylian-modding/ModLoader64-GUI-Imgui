import { Window } from "../Window";
import { ImGui } from 'ml64tk';
import { ConfigObject, masterConfigObject } from '../Config';
import { DrawInputTextLeft } from "../Utils";

export default class ConfigWindow extends Window {

    refs!: ConfigObject;

    onInit(): void {
        this.refs = masterConfigObject;
    }

    getName(): string {
        return "Config###ML64ConfigWindow"
    }

    drawContents(): void {
        /* if(ImGui.button("test")) {
            ImGui.text("text");
        } */

        // Configure Flags for advanced mode
        if (ImGui.checkbox("Enable Advanced Mode", this.refs.showAdvancedTab)) {
        }
        if (this.refs.showAdvancedTab[0]) {
            if (ImGui.checkbox("Host local server", this.refs.isSinglePlayer)) {
            }
            if (ImGui.checkbox("Connect to unofficial server", this.refs.serverOverride)) {
            }
            DrawInputTextLeft("IP  ", this.refs.IpAddr, ImGui.InputTextFlags.CharsDecimal);
            DrawInputTextLeft("Port", this.refs.port, ImGui.InputTextFlags.CharsDecimal);
        }


        if (ImGui.button("Save")) {
            this.refs.update();
        }
    }

}