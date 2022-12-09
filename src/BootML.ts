import child_process from "child_process";
import { masterConfigObject } from './Config';

export default class BootML {

    static instance: child_process.ChildProcess;

    static start(extra?: boolean) {
        const options = {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
            silent: true,
        };

        let args = ['--dir=./client'];
        if (masterConfigObject.overrideModPath[0] !== ""){
            args.push(`--mods=${masterConfigObject.overrideModPath[0]}`);
        }
        if (masterConfigObject.overrideRomPath[0] !== ""){
            args.push(`--roms=${masterConfigObject.overrideRomPath[0]}`);
        }
        if(extra) {
            args.push(`--extradata=${extra}`);
        }

        this.instance = child_process.fork("./client/src/index.js", args, options as child_process.ForkOptions);

        this.instance!.stdout!.on('data', (buf: Buffer) => {
            let msg: string = buf.toString();
            if (msg === '' || msg === null || msg === undefined) {
                return;
            }
            console.log(msg);
        });
    }

}