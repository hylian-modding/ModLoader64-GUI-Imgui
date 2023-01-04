import path from "path";
import Updater, { CONDA_URL } from "./Updater";
import fs from 'fs';

(async () => {
    let repo = await Updater.getRepoData(CONDA_URL);

    let url = repo.getFileURL("modloader64-gui");
    console.log(url);
    let pkg = await Updater.downloadFile("modloader64-gui", repo);

    let platform = "linux-64";
    if (process.platform === "win32") {
        platform = "win-64";
    }

    if (platform === "win-64"){
        fs.copyFileSync(path.resolve(pkg, "Scripts", "modloader64-gui.exe"), path.resolve(".", "modloader64-gui.exe"));
    }else{
        fs.copyFileSync(path.resolve(pkg, "bin", "modloader64-gui"), path.resolve(".", "modloader64-gui"));
    }
})();