import Updater, { CONDA_REPOS, RepoData } from "../Updater";
import { Window } from "../Window";
import { ImGui } from "ml64tk";
import fs from 'fs-extra';
import { DrawInputTextLeft } from "../Utils";
import { masterConfigObject } from "../Config";

class ModListing {
    name: string;
    repo: RepoData;
    id: string;

    constructor(id: string, name: string, repo: RepoData) {
        this.id = id;
        this.name = name;
        this.repo = repo;
    }
}

class SubscribedMod {
    name: string;
    file: string;

    constructor(name: string, file: string) {
        this.name = name;
        this.file = file;
    }
}

export const packagesFolder: string = "./packages";

export default class ModInstallerWindow extends Window {

    possibleMods: Map<string, ModListing[]> = new Map();
    addRepoText: string[] = [""];
    subscribedMods: SubscribedMod[] = [];

    getName(): string {
        return "Get More Content###ML64ModInstaller"
    }

    onInit(): void {
        if (!fs.existsSync(packagesFolder)) {
            fs.mkdirSync(packagesFolder);
        }
    }

    drawContents(): void {
        DrawInputTextLeft("Add mod channel", this.addRepoText);
        ImGui.sameLine();
        if (ImGui.smallButton("Submit###AddModChannelSubmit")) {
            masterConfigObject.condaUrls.push(this.addRepoText[0]);
            this.addRepoText[0] = "";
            masterConfigObject.update();
            this.possibleMods.clear();
        }
        if (this.possibleMods.size === 0) {
            if (ImGui.smallButton("Fetch mods from subscribed channels")) {
                this.possibleMods.clear();
                Updater.setupConda(true).then(() => {
                    for (let i = 0; i < CONDA_REPOS.length; i++) {
                        this.possibleMods.set(CONDA_REPOS[i].url, []);
                        let repo = CONDA_REPOS[i];
                        let noarch = repo.subs.get("noarch")!.packages;
                        Object.keys(noarch).forEach((mod: string) => {
                            let l = new ModListing(mod, noarch[mod].name, repo);
                            this.possibleMods.get(CONDA_REPOS[i].url)!.push(l);
                        });
                    }
                }).catch((err: any) => {
                    console.error(err);
                });
            }
        } else {
            this.possibleMods.forEach((value: ModListing[], url: string) => {
                if (ImGui.treeNode(url)) {
                    for (let i = 0; i < value.length; i++) {
                        if (ImGui.smallButton(value[i].name)) {
                            Updater.install(value[i].name, "noarch");
                        }
                    }
                    ImGui.treePop();
                }
            });
        }
    }

}