import express from 'express';
import { Request, Response } from 'express';
import * as packages from '../../controllers/packages';
import { prisma, pkgModelUtils } from '../../clients';
import * as api from '../../types/api'; 
import { process_urls, calc_final_result, OutputObject } from '../../package-metrics/src/index';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
    const content = req.body['Content'];
    const url = req.body['URL'];
    logger.log('info', 'Ingesting package...');

    // Cannot specify both content and url
    if (content && url) {
        res.status(400).end();
        return;
    }

    try {
        let pkgData: packages.PkgData;
        if (content) {
            pkgData = await packages.extractFromZip(content);
        }
        else if (url) {
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
        else {
            res.status(400).end();
            logger.log('info', 'Missing necessary data.');
            return;
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

router.get('/:id', async (req: Request, res: Response) => {
    logger.log('info', 'Getting package...');
    const pkg = await prisma.package.findFirst({
        where: {
            id: parseInt(req.params.id)
        }
    });

    if (!pkg) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }
    
    const filename = packages.createPkgFilename(pkg.name, pkg.version);
    res.status(200).send({
        data: {
            Content: await packages.gcpDownload(filename)
        },
        metadata: {
            ID: pkg.id.toString(),
            Name: pkg.name,
            Version: pkg.version
        }
    });
    logger.log('info', 'Package found.');
});

router.put('/:id', async (req: Request, res: Response) => {
    const apiPkg: api.Package = req.body['Package'];
    const metadata: api.PackageMetadata = apiPkg.metadata;
    const data: api.PackageData = apiPkg.data;

    logger.log('info', 'Updating package...');

    if (!data.Content) {
        logger.log('info', 'No package provided.');
        res.status(400).end();
        return;
    }

    const pkg = await prisma.package.findFirst({
        where: {
            id: parseInt(req.params.id)
        }
    });

    if (!pkg) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }

    // Check name and version in db matches the name and version in the request
    if (pkg.name != metadata.Name || pkg.version != metadata.Version) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }

    // upload to gcp
    const filename = packages.createPkgFilename(pkg.name, pkg.version);
    await packages.gcpUpload(filename, data.Content);

    res.status(200).end();
    logger.log('info', 'Package updated.');
});

router.delete('/:id', async (req: Request, res: Response) => {
    logger.log('info', 'Deleting package...');
    let pkg;
    try {
        pkg = await prisma.package.delete({
            where: {
                id: parseInt(req.params.id)
            }
        });
    } catch (e) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }

    const filename = packages.createPkgFilename(pkg.name, pkg.version);
    await packages.gcpDelete(filename);
    res.status(200).end();
    logger.log('info', 'Package deleted.');
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