import { promisify } from 'util';
import { exec } from "child_process";

async function cloneRepo(repoUrl: string, clonePath: string) {
    const command = `git clone ${repoUrl} ${clonePath}`;
    await promisify(exec)(command);
}

async function deleteClonedRepo(repoPath: string) {
    const command = `rm -rf ${repoPath}`;
    await promisify(exec)(command);
}

export {
    cloneRepo,
    deleteClonedRepo
}