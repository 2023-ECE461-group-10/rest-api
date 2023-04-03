import express from 'express';
import { Request, Response } from 'express';
import { authenticate, generateAccessToken } from '../auth';
import * as api from '../types/api';

const router = express.Router();

router.put('/', async (req: Request, res: Response) => {
    const user: api.User = req.body['User'];
    const authInfo: api.UserAuthenticationInfo = req.body['Secret'];

    try {
        var token: string = await authenticate(user, authInfo);
    } catch (e) {
        console.log(e);
        res.status(401).end();
    }

    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(token));
});

export = router;