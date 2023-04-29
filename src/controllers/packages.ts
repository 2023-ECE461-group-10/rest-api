import fs from 'fs';
import * as path from 'path';
import { writeFile, rm, readFile, readdir } from 'fs/promises';
import decompress from 'decompress';
import { gcpStorage } from '../clients';
import parse from 'parse-github-url';
import { cloneRepo } from './git';
import AdmZip from 'adm-zip';

type PkgJSON = {
    name?: string,
    version?: string,
    repository?: {
        url?: string
    },
    homepage?: {
        url?: string
    }
}

type PkgData = {
    metadata: PkgMetadata,
    content: string
};

type PkgMetadata = {
    name?: string,
    version?: string,
    url?: string,
    readme?: string
}

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

function findReadme(pkgDir: string): string | undefined {
    return fs.readdirSync(pkgDir, {withFileTypes: true})
        .filter(f => f.isFile())
        .filter(f => f.name.toLowerCase().startsWith('readme'))
        .map(f => f.name)[0];
}

async function decompressBase64Zip(base64Zip: string, workDir: string) {
    const zipPath = path.join(workDir, 'ece461restapi.zip');
    await writeFile(zipPath, base64Zip, {encoding: 'base64'});
    await decompress(zipPath, workDir);
    await rm(zipPath);
}

async function createZip(dir: string): Promise<string> {
    const zip = new AdmZip();
    const entries = (await Promise.all(await readdir(dir, { withFileTypes: true })));

    entries.filter(e => e.isDirectory())
        .map(d => path.join(dir, d.name))
        .forEach(d => zip.addLocalFolder(d));

    entries.filter(e => e.isFile())
        .map(f => path.join(dir, f.name))
        .forEach(f => zip.addLocalFile(f));
    
    const buffer = await zip.toBufferPromise();
    return buffer.toString('base64');
}

async function extractPkgMetadata(pkgDir: string): Promise<PkgMetadata> {
    const pkgJSONPath = path.join(pkgDir, 'package.json');
    const pkgJSONStr = await readFile(pkgJSONPath, {encoding: 'utf8'});
    const pkgJSON: PkgJSON = JSON.parse(pkgJSONStr);

    const name = pkgJSON.name;
    logger.log('info', 'Pkg name is ' + name);

    const version = pkgJSON.version;
    logger.log('info', 'Pkg version is ' + version);

    const parsedGitURL = parse(pkgJSON.repository?.url || pkgJSON.homepage?.url);
    let url;
    if (parsedGitURL) {
        url = `https://github.com/${parsedGitURL.repository}`;
    }
    logger.log('info', 'Pkg url is ' + url);
    
    const readmePath = path.join(pkgDir, findReadme(pkgDir));
    let readme;
    if (readmePath) {
        logger.log('info', 'Pkg has a readme');
        readme = await readFile(readmePath, {encoding: 'utf8'});
    }

    return { name, version, url, readme }
}

async function extractFromZip(content: string): Promise<PkgData> {
    const workDir = createWorkDir();
    await decompressBase64Zip(content, workDir);
    const metadata = await extractPkgMetadata(workDir);
    removeWorkDir(workDir);
    logger.log('info', 'Extracted from zip.');
    return {
        metadata: metadata,
        content: content
    };
}

async function extractFromRepo(url: string): Promise<PkgData> {
    const workDir = createWorkDir();
    await cloneRepo(url, workDir);
    const metadata = await extractPkgMetadata(workDir);
    metadata.url = metadata.url || url;
    const content = await createZip(workDir);
    removeWorkDir(workDir);
    logger.log('info', 'Extracted from repo.');
    return {
        metadata: metadata,
        content: content
    };
}

async function gcpUpload(filename: string, base64File: string) {
    logger.log('info', 'Uploading to GCP...');
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
    logger.log('info', 'Package uploaded.');
}

async function gcpDownload(filename: string): Promise<string> {
    logger.log('info', 'Downloading from GCP...');
    const workDir = createWorkDir();
    const bucket = await gcpStorage.bucket(PACKAGE_STORAGE_BUCKET);
    const file = await bucket.file(filename);
    const filePath = path.join(workDir, filename);
    await file.download({ destination: filePath });
    const contents = await readFile(filePath, {encoding: 'base64'});
    removeWorkDir(workDir);
    logger.log('info', 'Package downloaded.');

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
    PkgData,
    extractPkgMetadata,
    extractFromZip,
    extractFromRepo,
    gcpUpload,
    gcpDownload,
    gcpDelete,
    createPkgFilename
};
