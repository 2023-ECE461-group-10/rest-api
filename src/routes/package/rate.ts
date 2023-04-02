import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

router.get('/:id/rate', (req: Request, res: Response) => {
    res.status(200).json({hello: 'hello'});
});

export = router;