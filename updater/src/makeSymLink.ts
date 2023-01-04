import path from 'path';
import fs from 'fs-extra';

export function makeSymlink(src: string, dest: string): void {
    try {
        let p = path.parse(dest);
        if (!fs.existsSync(p.dir)) {
            fs.mkdirSync(p.dir, { recursive: true });
        }
        if (fs.existsSync(dest)) {
            fs.removeSync(dest);
        }
        fs.link(src, dest);
    } catch (err) {
        console.log(err);
    }
}
