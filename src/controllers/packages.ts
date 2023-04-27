import fs from 'fs';
import * as path from 'path';
import { mkdir, writeFile, rm, readFile } from 'fs/promises';
import decompress from 'decompress';
import { gcpStorage, prisma } from '../clients';

type PkgMetadata = {
    version: string,
    name: string
};

const PARENT_DIR = process.env.WORK_DIR_PARENT;
const WORK_DIR_PREFIX = 'work_dir_';
const PACKAGE_STORAGE_BUCKET = process.env.PACKAGE_STORAGE_BUCKET_NAME;

// Must be syncronous to avoid the case where two request
// processing chains read the parent directory in the same state 
// and try to take the same work directory (read/write atomicity)
function createWorkDir(): string {
    if (!fs.existsSync(PARENT_DIR)){
        fs.mkdirSync(PARENT_DIR);
    }

    const takenNumbers = fs.readdirSync(PARENT_DIR, { withFileTypes: true })
        .filter(f => f.isDirectory())
        .filter(f => f.name.startsWith(WORK_DIR_PREFIX))
        .map(swdir => swdir.name.slice(-1))
        .map(parseInt);
    
    let number = 0;
    while (number++ in takenNumbers);

    const workDir = path.join(PARENT_DIR, WORK_DIR_PREFIX + number);
    fs.mkdirSync(workDir, { recursive: true });
    return workDir;
}

function removeWorkDir(workDir: string) {
    fs.rmSync(workDir, { recursive: true, force: true });
}

async function getMetadata(base64Content: string): Promise<PkgMetadata> {
    const workDir = createWorkDir();
    const zipPath = path.join(workDir, 'ece461restapi.zip');
    await writeFile(zipPath, base64Content, {encoding: 'base64'});
    await decompress(zipPath, workDir);
    const pkgJSONPath = path.join(workDir, 'package.json');
    const contents = await readFile(pkgJSONPath, {encoding: 'utf8'});
    removeWorkDir(workDir);

    return JSON.parse(contents);
}

async function gcpUpload(filename: string, base64File: string) {
    const fileContent = Buffer.from(base64File, 'base64');

    const bucket = gcpStorage.bucket(PACKAGE_STORAGE_BUCKET)
    const file = bucket.file(filename);
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/octet-stream',
      },
    });

    await new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(fileContent);
    });
}

async function gcpDownload(filename: string): Promise<string> {
    const workDir = createWorkDir();
    const bucket = await gcpStorage.bucket(PACKAGE_STORAGE_BUCKET);
    const file = await bucket.file(filename);
    const filePath = path.join(workDir, filename);
    await file.download({ destination: filePath });
    const contents = await readFile(filePath, {encoding: 'base64'});
    removeWorkDir(workDir);

    return contents;
}

async function gcpDelete(filename: string): Promise<void> {
    const bucket = await gcpStorage.bucket(PACKAGE_STORAGE_BUCKET);
    const file = await bucket.file(filename);
    await file.delete();
}

function createPkgFilename(name: string, version: string): string {
    return name + '-' + version + '.zip';
}

export {
    getMetadata,
    gcpUpload,
    gcpDownload,
    gcpDelete,
    createPkgFilename
};
