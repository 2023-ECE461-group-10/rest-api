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
                rating.LicenseScore < 0.5 ||
                rating.GoodPinningPractice < 0.5 ||
                rating.PullRequest < 0.5 ||
                rating.NetScore < 0.5) {
                res.status(424).end();
                return;
            }

            pkgData = await packages.extractFromRepo(url);
        }
        else {
            res.status(400).end();
            return;
        }

        const metadata = pkgData.metadata;

        // Check all necessary data existed in the package
        if (!metadata.name || 
            !metadata.version || 
            !metadata.url ||
            !metadata.readme ) {
            res.status(400).end();
            return;
        }

        // Check if the package already exists
        if (await pkgModelUtils.checkPkgExists(metadata.name, metadata.version)) {
            res.status(409).end();
            return;
        }

        // Upload to GCP Cloud Storage
        const filename = packages.createPkgFilename(metadata.name, metadata.version);
        await packages.gcpUpload(filename, content);
                
        // Create Package
        const pkg = await prisma.package.create({
            data: { 
                name: metadata.name,
                version: metadata.version,
                url: metadata.url,
                readme: metadata.readme.substring(0, 65535)
            }
        });
                
        // Return package back to user
        res.status(201).send({
            data: {
                Content: content
            },
            metadata: {
                ID: pkg.id.toString(),
                Name: pkg.name,
                Version: pkg.version
            }
        });
    } catch (e) {
        console.log(e);
        res.status(400).end();
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    const pkg = await prisma.package.findFirst({
        where: {
            id: parseInt(req.params.id)
        }
    });

    if (!pkg) {
        res.status(404).end();
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
});

router.put('/:id', async (req: Request, res: Response) => {
    const apiPkg: api.Package = req.body['Package'];
    const metadata: api.PackageMetadata = apiPkg.metadata;
    const data: api.PackageData = apiPkg.data;

    if (!data.Content) {
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
        return;
    }

    // Check name and version in db matches the name and version in the request
    if (pkg.name != metadata.Name || pkg.version != metadata.Version) {
        res.status(404).end();
        return;
    }

    // upload to gcp
    const filename = packages.createPkgFilename(pkg.name, pkg.version);
    await packages.gcpUpload(filename, data.Content);

    res.status(200).end();
});

router.delete('/:id', async (req: Request, res: Response) => {
    const pkg = await prisma.package.delete({
        where: {
            id: parseInt(req.params.id)
        }
    });

    if (!pkg) {
        res.status(404).end();
        return;
    }

    const filename = packages.createPkgFilename(pkg.name, pkg.version);
    await packages.gcpDelete(filename);
    res.status(200).end();
});

router.delete('/byName/:name', async (req: Request, res: Response) => {
    if (req.params.name == '*') {
        if (!req.authTokenData.isAdmin) {
            res.status(400).end();
            return;
        }
        await prisma.package.deleteMany();
        res.status(200).end();
        return;
    }

    const pkgs = await prisma.package.deleteMany({ 
        where: {
            name: req.params.name
        }
    });

    // Won't delete them from gcp

    res.status(pkgs ? 200 : 404).end();
});

export = router;