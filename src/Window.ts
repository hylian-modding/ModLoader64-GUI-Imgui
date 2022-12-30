import { ImGui } from 'ml64tk';

export abstract class Window {

    abstract getName(): string;

    abstract onInit(): void;

    startDraw() {
        if (ImGui.begin("ModLoader64-GUI")) {
            if (ImGui.beginTabBar("MainTabBar")) {
                if (ImGui.beginTabItem(this.getName())) {
                    this.drawContents();
                    ImGui.endTabItem();
                }
            }
            ImGui.endTabBar();
            ImGui.end();
        }
    }

    abstract drawContents(): void;

}