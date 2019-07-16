const http = require('http');
const path = require('path');
const pfs = require('fs').promises;

(async function host(port) {
    var config = JSON.parse(await pfs.readFile(path.resolve('config.json')));
    const DEST_DIR = path.join(__dirname, config.DEST_DIR);

    (http.createServer(async function (request, response) {
        request.path = request.url.split('?')[0];
        try {
            let filePath = path.join(DEST_DIR, request.path);
            let file = await pfs.readFile(filePath);
            response.writeHead(200);
            response.end(file);
        } catch (error) {
            response.writeHead(500);
            response.end(error.message);
            pfs.writeFile(path.resolve('logs.txt'), `File ${request.url} requested but not found. ${error}\n`);
        }
    })).listen(port, () => console.log(`Server running on port ${port}`));
})(8000);