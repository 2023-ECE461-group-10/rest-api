import express from 'express';
import { Request, Response } from 'express';
import { prisma } from '../../clients';
import { Package } from '@prisma/client';

const router = express.Router();

router.post('/byRegEx', async (req: Request, res: Response) => {
    const regex = req.body.RegEx;

    const pkgs = await prisma
    .$queryRaw<Package[]>`SELECT * FROM Package WHERE name REGEXP ${regex} OR readme REGEXP ${regex};`;

    if (!pkgs) {
        res.status(404).end();
        return;
    }

    res.status(200).send(pkgs.map(pkg => {
        return {
            Version: pkg.version,
            Name: pkg.name
        }
    }));
});

export = router;