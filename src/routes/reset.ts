import express from 'express';
import { Request, Response } from 'express';
import config from '../config';
import { IfNotAdmin } from '../middleware/auth';
import { prisma, userModelUtils } from '../clients';

const router = express.Router();

router.delete('/', IfNotAdmin(401), async (req: Request, res: Response) => {
    await prisma.package.deleteMany();
    await prisma.user.deleteMany();
    await userModelUtils.create(config.defaultUserCreateCmd);
    res.status(200).end();
});

export = router;