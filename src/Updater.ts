import https from 'https';
import http from 'http';
import fs from 'fs-extra';
import path from 'path';
import decompress from 'decompress';
import { masterConfigObject } from './Config';
import child_process from 'child_process';
import { setCoreDownloadComplete, setCoreDownloadStarted } from '.';
import { packagesFolder } from './Windows/ModInstallerWindow';
import { makeSymlink } from './makeSymlink';
import { modBus } from './Windows/ModsWindow';

function getJSON(url: string): Promise<any> {
    const proto = !url.charAt(4).localeCompare('s') ? https : http;
    return new Promise((resolve, reject) => {
        proto.get(url, (res) => {
            let body = "";

            res.on("data", (chunk) => {
                body += chunk;
            });

            res.on("end", () => {
                try {
                    let json = JSON.parse(body);
                    resolve(json);
                } catch (error: any) {
                    console.error(error.message);
                    reject(error);
                };
            });

        }).on("error", (error) => {
            console.error(error.message);
            reject(error);
        });
    });
}

async function download(url: string, filePath: string) {
    const proto = !url.charAt(4).localeCompare('s') ? https : http;

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        let fileInfo: any = null;

        const request = proto.get(url, response => {
            if (response.statusCode !== 200) {
                fs.unlink(filePath, () => {
                    reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                });
                return;
            }

            fileInfo = {
                mime: response.headers['content-type'],
                size: parseInt(response.headers['content-length'] as any, 10),
            };

            response.pipe(file);
        });

        file.on('finish', () => resolve(fileInfo));

        request.on('error', err => {
            fs.unlink(filePath, () => reject(err));
        });

        file.on('error', err => {
            fs.unlink(filePath, () => reject(err));
        });

        request.end();
    });
}

export class RepoData {
    url: string = "";
    data: any;
    subs: Map<string, any> = new Map();

    getFileURL(id: string, arch?: string) {
        let platform = "linux-64";
        if (process.platform === "win32") {
            platform = "win-64";
        }
        if (arch !== undefined) platform = arch;
        for (let entry of this.subs.entries()) {
            let key = entry[0], value = entry[1].packages;
            if (key !== platform) continue;
            let r = "";
            Object.keys(value).forEach((k: string) => {
                if (id === value[k].name) {
                    r = k;
                }
            });
            if (r === "") continue;
            return `${this.url}/${key}/${r}`;
        }
    }

    getBuildNumber(id: string) {
        let b = -1;
        for (let entry of this.subs.entries()) {
            let key = entry[0], value = entry[1].packages;
            let r = "";
            Object.keys(value).forEach((k: string) => {
                if (id === value[k].name) {
                    r = k;
                }
            });
            if (r === "") continue;
            b = parseInt(value[r].build);
        }
        return b;
    }

    getVersionNumber(id: string, arch?: string) {
        let platform = "linux-64";
        if (process.platform === "win32") {
            platform = "win-64";
        }
        if (arch !== undefined) platform = arch;
        let b = "";
        for (let entry of this.subs.entries()) {
            let key = entry[0], value = entry[1].packages;
            if (key !== platform) continue;
            let r = "";
            Object.keys(value).forEach((k: string) => {
                if (id === value[k].name) {
                    r = k;
                }
            });
            if (r === "") continue;
            b = value[r].version;
        }
        return `${b}-${this.getBuildNumber(id)}`;
    }
}

export const CONDA_URL_NIGHTLY: string = "https://repo.modloader64.com/conda/nightly";
export const CONDA_URL_MUPEN: string = "https://repo.modloader64.com/conda/mupen";
export const CONDA_URL_DOLPHIN: string = "https://repo.modloader64.com/conda/dolphin";

export const CONDA_REPO_URLS: string[] = [CONDA_URL_NIGHTLY, CONDA_URL_MUPEN, CONDA_URL_DOLPHIN];
export const CONDA_REPOS: RepoData[] = [];

export default class Updater {

    static async setupConda(forceReload?: boolean) {
        if (masterConfigObject.condaUrls.length > 0) {
            CONDA_REPO_URLS.length = 0;
            CONDA_REPO_URLS.push(...masterConfigObject.condaUrls);
        }
        if (CONDA_REPO_URLS.indexOf(CONDA_URL_NIGHTLY) === -1) {
            CONDA_REPO_URLS.push(CONDA_URL_NIGHTLY);
            CONDA_REPO_URLS.push(CONDA_URL_MUPEN);
            CONDA_REPO_URLS.push(CONDA_URL_DOLPHIN);
        }
        if (CONDA_REPOS.length === 0 || forceReload) {
            CONDA_REPOS.length = 0;
            for (let i = 0; i < CONDA_REPO_URLS.length; i++) {
                try {
                    await this.getRepoData(CONDA_REPO_URLS[i]);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }

    static async downloadFile(id: string, data: RepoData, arch?: string) {
        let temp = fs.mkdtempSync("download_");
        console.log(`Downloading ${id}...`);
        await download(data.getFileURL(id, arch)!, path.resolve(temp, "temp.tar.bz2"));
        console.log("Extracting...");
        await decompress(path.resolve(temp, "temp.tar.bz2"), path.resolve(temp));
        fs.removeSync(path.resolve(temp, "temp.tar.bz2"));
        return temp;
    }

    static find(id: string, arch?: string) {
        let platform = "linux-64";
        if (process.platform === "win32") {
            platform = "win-64";
        }
        if (arch !== undefined) platform = arch;
        for (let i = 0; i < CONDA_REPOS.length; i++) {
            let check = CONDA_REPOS[i].getFileURL(id, platform);
            if (check) return CONDA_REPOS[i];
        }
    }

    static async install(id: string, arch?: string) {
        let platform = "linux-64";
        if (process.platform === "win32") {
            platform = "win-64";
        }
        if (arch !== undefined) platform = arch;
        setCoreDownloadStarted(id);
        Updater.downloadFile(id, this.find(id, arch)!, platform).then((p: string) => {
            let nf = path.resolve(packagesFolder, id);
            if (fs.existsSync(nf)) {
                fs.removeSync(nf);
            }
            fs.mkdirSync(nf);
            fs.copySync(p, nf);
            let info = path.resolve(nf, "info");
            let index = fs.readJSONSync(path.resolve(info, "index.json"));
            let paths = fs.readJSONSync(path.resolve(info, "paths.json")).paths;
            console.log(`Processing ${paths.length} paths for package ${id}...`);
            for (let i = 0; i < paths.length; i++) {
                let _path = paths[i]._path;
                makeSymlink(path.resolve(nf, _path), path.resolve(".", _path));
            }
            fs.removeSync(p);
            modBus.emit('REFRESH', {});
            if (index.depends !== undefined) {
                for (let i = 0; i < index.depends.length; i++) {
                    console.log(`Resolving dependency: ${index.depends[i]}...`);
                    setTimeout(() => {
                        ModUpdater.loadPackageData();
                        if (!ModUpdater.PACKAGE_INDEX_DATA.has(index.depends[i])) {
                            this.install(index.depends[i], arch);
                        }
                    }, 1);
                }
            }
            setCoreDownloadComplete();
        });
    }

    static async getRepoData(url: string) {
        console.log(`Loading channel ${url}...`);
        let rd = new RepoData();
        let data = await getJSON(`${url}/channeldata.json`);
        let subs: Map<string, any> = new Map();

        rd.url = url;
        rd.data = data;
        rd.subs = subs;

        for (let i = 0; i < data.subdirs.length; i++) {
            let s = await getJSON(`${url}/${data.subdirs[i]}/repodata.json`);
            subs.set(data.subdirs[i], s);
        }
        let arr: any[] = [];
        Object.keys(data.packages).forEach(async (name: string) => {
            arr.push({ "Name": name, "Version": data.packages[name]["version"], "Build": rd.getBuildNumber(name), "Channel": url });
        });
        console.table(arr);
        CONDA_REPOS.push(rd);
        return rd;
    }

}

export class DownloadModLoaderCore {

    static async download() {
        Updater.setupConda().then(() => {
            Updater.install("modloader64-client");
        }).catch(() => { });
    }

    static getLocalVersionString(): string | undefined {
        try {
            let vf = JSON.parse(fs.readFileSync(path.resolve(packagesFolder, "modloader64-client", "info", "index.json")).toString());
            return `${vf.version}-${vf.build}`;
        } catch (err) { }
        return undefined;
    }

    static async checkForUpdate() {
        Updater.setupConda().then(() => {
            console.log("Checking ModLoader core for updates...");
            let v = Updater.find("modloader64-client")!.getVersionNumber("modloader64-client");
            let v2 = this.getLocalVersionString();
            if (v !== v2) {
                this.download();
            }
            ModUpdater.loadPackageData();
            ModUpdater.checkForUpdates();
        });
    }

}

export interface ModIndexData {
    version: string;
    build: number;
    name: string;
    depends?: string[];
}

export interface ModPathData {
    _path: string;
}

export class ModUpdater {

    static PACKAGE_INDEX_DATA: Map<string, ModIndexData> = new Map();
    static PACKAGE_PATH_DATA: Map<string, ModPathData> = new Map();

    static loadPackageData() {
        this.PACKAGE_INDEX_DATA.clear();
        this.PACKAGE_PATH_DATA.clear();
        fs.readdirSync(packagesFolder).forEach((f: string) => {
            let dir = path.resolve(packagesFolder, f);
            if (fs.lstatSync(dir).isDirectory()) {
                let info = path.resolve(dir, "info");
                let infofile = path.resolve(info, "index.json");
                if (!fs.existsSync(info) || !fs.existsSync(infofile)){
                    console.error(`Corrupt package? ${f}`);
                    console.error(`This package seems to be broken. Information to repair it isn't available. You should reinstall it.`);
                    return;
                }
                let index = fs.readJSONSync(infofile);
                let paths = fs.readJSONSync(path.resolve(info, "paths.json"));
                this.PACKAGE_INDEX_DATA.set(path.parse(dir).name, index);
                this.PACKAGE_PATH_DATA.set(path.parse(dir).name, paths);
                console.log(`indexing installed package ${f}`);
            }
        });
    }

    static checkForUpdates() {
        this.PACKAGE_INDEX_DATA.forEach((data: ModIndexData, key: string) => {
            for (let i = 0; i < CONDA_REPOS.length; i++) {
                let check = CONDA_REPOS[i].getFileURL(key, "noarch");
                if (check) {
                    console.log(`Checking ${key} for update...`);
                    let v = CONDA_REPOS[i].getVersionNumber(key, "noarch");
                    let vstring = `${data.version}-${data.build}`;
                    if (v !== vstring) {
                        Updater.install(key, "noarch").then(() => { }).catch((err: any) => {
                            console.log(err);
                        });
                    } else {
                        console.log("No update needed.");
                    }
                    break;
                }
            }
        });
    }
}