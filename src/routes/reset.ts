import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

router.delete('/', (req: Request, res: Response) => {
    res.status(200).json({hello: 'hello'});
});

export = router;