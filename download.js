const https = require('https');
const path = require('path');
const fs = require('fs');
const pfs = fs.promises;

const SRC_DIR = path.join(__dirname, 'files');
const DEST_DIR = path.join(__dirname, 'dest');

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
        var request = https.get(url, response => {
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

async function download() {
    let files = [];
    for (let fileName of await pfs.readdir(SRC_DIR)) {
        let filePath = path.join(SRC_DIR, fileName);
        let newFiles = (await pfs.readFile(filePath, 'utf-8'))
            .split('\n').map(s => s.trim()).filter(s => s.length);
        files = files.concat(newFiles);
    }
    for (let file of files) {
        let destPath = path.join(DEST_DIR, file);
        let url = 'https://media.svt.se/' + file

        if (await exists(destPath))
            continue;

        let dir = path.dirname(destPath);
        if (!(await exists(dir))) {
            await pfs.mkdir(dir, {
                recursive: true
            });
        }

        console.log(`Downloading ${file}`);
        await downloadFile(url, destPath);
    }
}

download();
