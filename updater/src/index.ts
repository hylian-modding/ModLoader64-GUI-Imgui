import path from "path";
import Updater, { CONDA_URL } from "./Updater";
import fs from 'fs';

(async () => {
    let u = new Updater();
    let repo = await u.getRepoData(CONDA_URL);

    let remote_v = repo.getVersionNumber("modloader64-gui");
    let remote_b = repo.getBuildNumber("modloader64-gui");
/*     if (remote_v === VERSION && remote_b === BUILD) {
        console.log("No update needed.");
    } else {
        let url = repo.getFileURL("modloader64-gui");
        console.log(url);
    } */

    let url = repo.getFileURL("modloader64-gui");
    console.log(url);
    let pkg = await u.downloadFile("modloader64-gui", repo);

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