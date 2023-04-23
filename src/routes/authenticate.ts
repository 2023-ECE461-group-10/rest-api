import express from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../services/auth';
import * as api from '../types/api';

const router = express.Router();

router.put('/', async (req: Request, res: Response) => {
    const user: api.User = req.body['User'];
    const authInfo: api.UserAuthenticationInfo = req.body['Secret'];

    try {
        const token: string = await authenticate(user, authInfo);
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(token));
    } catch (e) {
        res.status(401).end();
    }
});

export = router;