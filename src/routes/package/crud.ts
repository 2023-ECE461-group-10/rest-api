import express from 'express';
import { Request, Response } from 'express';
import * as packages from '../../controllers/packages';
import { prisma, pkgModelUtils } from '../../clients';
import * as api from '../../types/api'; 

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
    const content = req.body['Content'];
    const url = req.body['URL'];

    if (content && url) {
        res.status(400).end();
        return;
    }
    
    if (content) {
        try {
            const { name, version } = await packages.getMetadata(content);

            if (await pkgModelUtils.checkPkgExists(name, version)) {
                res.status(409).end();
                return;
            }

            // Upload to GCP Cloud Storage
            const filename = packages.createPkgFilename(name, version);
            await packages.gcpUpload(filename, content);
            
            // Create Package
            const pkg = await prisma.package.create({
                data: { name, version }
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
            return;
        }
        catch (e) {
            console.log(e);
            res.status(400).end();
            return;
        }
    }
    else if (url) {
        // Ingestion procedure for URL

    }
    
    res.status(400).end();
});

router.get('/:id', async (req: Request, res: Response) => {
    let pkg = await prisma.package.findFirst({
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

    let pkg = await prisma.package.findFirst({
        where: {
            id: parseInt(req.params.id)
        }
    });

    if (!pkg) {
        res.status(404).end();
        return;
    }

    // Check name and version in db matches the name and version in the req
    if (pkg.name != metadata.Name || pkg.version != metadata.Version) {
        res.status(404).end();
        return;
    }

    // update package ratings

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

    const filename = packages.createPkgFilename(pkg.name, pkg.version);
    await packages.gcpDelete(filename);

    res.status(pkg ? 200 : 404).end();
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