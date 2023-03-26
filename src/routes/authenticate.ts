import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

router.put('/', (req: Request, res: Response) => {
    res.status(201).json({hello: 'hello'});
});

export = router;