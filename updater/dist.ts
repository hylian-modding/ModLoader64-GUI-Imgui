import AdmZip from 'adm-zip';

let condazip = new AdmZip();
condazip.addLocalFolder("./dist");
condazip.writeZip("./dist/modloader64-gui-updater-conda.zip");

let winzip = new AdmZip();
winzip.addLocalFolder("./dist/windows");
winzip.writeZip("./dist/windows/modloader64-gui-updater-win64.zip");

let nixzip = new AdmZip();
nixzip.addLocalFolder("./dist/linux");
nixzip.writeZip("./dist/linux/modloader64-gui-updater-linux.zip");