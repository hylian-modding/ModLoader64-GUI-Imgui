import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import decompress from 'decompress';

function getJSON(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
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

    getFileURL(id: string) {
        let platform = "linux-64";
        if (process.platform === "win32") {
            platform = "win-64";
        }
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
        let platform = "linux-64";
        if (process.platform === "win32") {
            platform = "win-64";
        }
        let b = -1;
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
            b = parseInt(value[r].build);
        }
        return b;
    }

    getVersionNumber(id: string) {
        let platform = "linux-64";
        if (process.platform === "win32") {
            platform = "win-64";
        }
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
        return b;
    }
}

export const CONDA_URL: string = "https://repo.modloader64.com/conda/nightly";

export default class Updater {

    async downloadFile(id: string, data: RepoData) {
        let temp = fs.mkdtempSync("download_");
        console.log("Downloading...");
        await download(data.getFileURL(id)!, path.resolve(temp, "temp.tar.bz2"));
        console.log("Extracting...");
        await decompress(path.resolve(temp, "temp.tar.bz2"), path.resolve(temp));
        return temp;
    }

    async getRepoData(url: string) {
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
        return rd;
    }

}