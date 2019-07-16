const https = require('https');
const path = require('path');
const fs = require('fs');
const pfs = fs.promises;

async function exists(path) {
    try {
        await pfs.stat(path);
        return true;
    } catch (err) {
        return false;
    }
}

function downloadFile(url, dest) {
    let file = fs.createWriteStream(dest);
    return new Promise((resolve, reject) => {
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', err => {
            fs.unlink(dest);
            reject(err);
        });
    });
}

(async function download() {
    var config = JSON.parse(await pfs.readFile(path.resolve('config.json')));
    const SRC_DIR = path.join(__dirname, config.SRC_DIR);
    const DEST_DIR = path.join(__dirname, config.DEST_DIR);
    const OVERRIDE_DIR = path.join(__dirname, config.OVERRIDE_DIR);

    let files = [];
    for (let fileName of await pfs.readdir(SRC_DIR)) {
        let filePath = path.join(SRC_DIR, fileName);
        let newFiles = (await pfs.readFile(filePath, 'ascii'))
            .split('\n').map(s => s.trim()).filter(s => s.length);
        files = files.concat(newFiles);
    }
    for (let file of files) {
        let destPath = path.join(DEST_DIR, file);
        let url = 'https://media.svt.se/' + file;
        let overridePath = path.join(OVERRIDE_DIR, file);

        if (await exists(destPath)) continue;
        let dir = path.dirname(destPath);
        if (!(await exists(dir))) {
            await pfs.mkdir(dir, {
                recursive: true
            });
        }

        if (await exists(overridePath)) {
            console.log(`Copying ${file}`);
            await pfs.copyFile(overridePath, destPath);
        } else {
            console.log(`Downloading ${file}`);
            await downloadFile(url, destPath);
        }
    }
})();