import express from 'express';
import { Request, Response } from 'express';
import * as packages from '../../services/packages';
import { prisma, pkgModelUtils } from '../../clients';
import * as api from '../../types/api'; 
import { process_urls, calc_final_result, OutputObject } from '../../package-metrics/src/index';
import { ValidateParamIsNumberElse } from '../../middleware/validation';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
    const content = req.body['Content'];
    const url = req.body['URL'];

    // Check that Content XOR URL is specified
    if (!content && !url) {
        logger.log('info', 'Missing content or url.');
        res.status(400).end();
        return;
    }
    else if (content && url) {
        logger.log('info', 'Cannot have both content and url');
        res.status(400).end();
        return;
    }

    try {
        logger.log('info', 'Ingesting package...');
        let pkgData: packages.PkgData;
        if (content) {
            pkgData = await packages.extractFromZip(content);
        }
        else {
            const rating: OutputObject = (await process_urls([url], calc_final_result))[0];
            
            if (rating.BusFactor < 0.5 ||
                rating.Correctness < 0.5 ||
                rating.RampUp < 0.5 ||
                rating.ResponsiveMaintainer < 0.5 ||
                rating.LicenseScore < 0.5) {
                res.status(424).end();
                logger.log('info', 'Package disqualified by metrics.');
                return;
            }
            logger.log('info', 'Package package passed metrics.');

            pkgData = await packages.extractFromRepo(url);
        }

        const metadata = pkgData.metadata;

        // Check all necessary data existed in the package
        if (!metadata.name || 
            !metadata.version || 
            !metadata.url) {
            res.status(400).end();
            logger.log('info', 'Missing necessary data.');
            return;
        }

        // Check if the package already exists
        if (await pkgModelUtils.checkPkgExists(metadata.name, metadata.version)) {
            res.status(409).end();
            logger.log('info', 'Package already exists.');
            return;
        }

        // Upload to GCP Cloud Storage
        const filename = packages.createPkgFilename(metadata.name, metadata.version);
        await packages.gcpUpload(filename, pkgData.content);
                
        // Create Package
        const pkg = await prisma.package.create({
            data: { 
                name: metadata.name,
                version: metadata.version,
                url: metadata.url,
                readme: metadata.readme?.substring(0, 65535) || ''
            }
        });
        logger.log('info', 'Database entry created.');
                
        // Return package back to user
        res.status(201).send({
            data: {
                Content: pkgData.content
            },
            metadata: {
                ID: pkg.id.toString(),
                Name: pkg.name,
                Version: pkg.version
            }
        });
        logger.log('info', 'Package succesfully ingested.');
    } catch (e) {
        logger.log('error', e)
        res.status(400).end();
    }
});

router.get('/:id', ValidateParamIsNumberElse('id', 404),
async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const pkg = await prisma.package.findFirst({where: {id}});
    if (!pkg) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }
    
    logger.log('info', 'Getting package...');
    const filename = packages.createPkgFilename(pkg.name, pkg.version);
    const content = await packages.gcpDownload(filename);
    res.status(200).send({
        data: {
            Content: content
        },
        metadata: {
            ID: pkg.id.toString(),
            Name: pkg.name,
            Version: pkg.version
        }
    });
    logger.log('info', 'Package found.');
});

router.put('/:id', ValidateParamIsNumberElse('id', 404),
async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const apiPkg: api.Package = req.body['Package'];
    const metadata: api.PackageMetadata = apiPkg.metadata;
    const data: api.PackageData = apiPkg.data;

    // Check that Content XOR URL is specified
    const content = data.Content;
    const url = data.URL;
    if (!content && !url) {
        logger.log('info', 'Missing content or url.');
        res.status(400).end();
        return;
    }
    else if (content && url) {
        logger.log('info', 'Cannot have both content and url');
        res.status(400).end();
        return;
    }

    // Check that a package with this id exists
    if (!(await prisma.package.findFirst({where:{id}}))) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }

    try {
        logger.log('info', 'Updating package...');
        const pkgData = content ? await packages.extractFromZip(content) :
                                  await packages.extractFromRepo(url);

        if (!pkgData.metadata.url) {
            res.status(400).end();
            logger.log('info', 'Missing url in package');
            return;
        }
    
        // Upload to GCP
        logger.log('info', 'Uploading to GCP');
        const filename = packages.createPkgFilename(metadata.Name, metadata.Version);
        await packages.gcpUpload(filename, data.Content);
        logger.log('info', 'Uploaded to GCP');

        logger.log('info', "Updating database entry");
        await prisma.package.update({
            where: {id},
            data: { 
                name: metadata.Name,
                version: metadata.Version,
                url: pkgData.metadata.url,
                readme: pkgData.metadata.readme?.substring(0, 65535) || ''
            }
        });
        logger.log('info', 'Database entry updated.');

        res.status(200).end();
        logger.log('info', 'Package updated.');
    } catch (e) {
        res.status(400).end();
        logger.log('info', 'Failed to update package');
    }
});

router.delete('/:id', ValidateParamIsNumberElse('id', 404),
async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    logger.log('info', 'Deleting package...');
    let pkg;
    try {
        pkg = await prisma.package.delete({where:{id}});
    } catch (e) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }
    logger.log('info', 'Package deleted.');

    // Delete from GCP
    const filename = packages.createPkgFilename(pkg.name, pkg.version);
    await packages.gcpDelete(filename);

    res.status(200).end();
});

router.delete('/byName/:name', async (req: Request, res: Response) => {
    if (req.params.name == '*') {
        logger.log('info', 'Deleting all packages...');
        if (!req.authTokenData.isAdmin) {
            res.status(400).end();
            logger.log('info', 'Not authorized.');
            return;
        }
        await prisma.package.deleteMany();
        res.status(200).end();
        logger.log('info', 'All packages deleted.');
        return;
    }

    logger.log('info', 'Deleting package by name...');

    const pkgs = await prisma.package.deleteMany({ 
        where: {
            name: req.params.name
        }
     });
    
     if (pkgs.count == 0) {
        res.status(404).end();
        logger.log('info', 'No packages to delete');
        return;
    }

    // Won't delete them from cloud storage bucket
    
    logger.log('info', 'Packages deleted.');
    res.status(200).end();
});

export = router;