import express from 'express';
import { Request, Response } from 'express';
import { prisma } from '../clients';
import { isValidNumber } from '../middleware/validation';

const router = express.Router();

const TAKE_LIMIT = 50;

router.post('/', async (req: Request, res: Response) => {
    if (!req.body.length) {
        res.status(400).end('Missing body.');
        return;
    }

    const name = req.body[0].Name;
    const offsetQParam = req.query['offset'];
    const offset = offsetQParam ? parseInt(offsetQParam.toString()) : 0;
    if (!isValidNumber(offset)) {
        res.status(400).end("Invalid offset provided");
        return;
    }

    logger.log('info', 'Getting packages from registry...');

    let pkgs;
    if (name == '*') {
        pkgs = await prisma.package.findMany({
            skip: offset * TAKE_LIMIT,
            take: TAKE_LIMIT,
            orderBy: {
                name: 'desc'
            }
        });
    }
    else {
        pkgs = await prisma.package.findMany({
            where: {
                name: {
                    // MySQL does case-insensitive search by default
                    contains: name
                }
            },
            skip: offset * TAKE_LIMIT,
            take: TAKE_LIMIT,
            orderBy: {
                name: 'desc'
            }
        });
    }

    const list = (await Promise.all(pkgs)).map(pkg => {
        return {
            Name: pkg.name,
            Version: pkg.version,
            ID: pkg.id
        }
    });
    res.status(200).setHeader('offset', offset + 1).send(list);
    logger.log('info', 'Got packages from registry.');
});

export = router;