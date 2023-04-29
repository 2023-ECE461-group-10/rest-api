import express from 'express';
import { Request, Response } from 'express';
import { prisma } from '../../clients';
import { Package } from '@prisma/client';

const router = express.Router();

router.post('/byRegEx', async (req: Request, res: Response) => {
    logger.log('info', 'Searching for package...');
    const regex = req.body.RegEx;

    const pkgs = await prisma
    .$queryRaw<Package[]>`SELECT * FROM Package WHERE name REGEXP ${regex} OR readme REGEXP ${regex};`;

    if (pkgs.length == 0) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }

    logger.log('info', 'Package found.');

    res.status(200).send(pkgs.map(pkg => {
        return {
            Version: pkg.version,
            Name: pkg.name
        }
    }));
});

export = router;