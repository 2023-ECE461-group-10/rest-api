import express from 'express';
import { Request, Response } from 'express';
import config from '../config';
import { IfNotAdmin } from '../middleware/auth';
import { prisma, userModelUtils } from '../clients';

const router = express.Router();

router.delete('/', IfNotAdmin(401), async (req: Request, res: Response) => {
    logger.log('info', 'Resetting registry...');
    await prisma.package.deleteMany();
    logger.log('debug', 'Packages deleted.');
    await prisma.user.deleteMany();
    logger.log('debug', 'Users deleted.');
    await userModelUtils.create(config.defaultUserCreateCmd);
    logger.log('debug', 'Default user recreated.');
    res.status(200).end();
    logger.log('info', 'Registry has been reset.');
});

export = router;