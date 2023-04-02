import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
    res.status(200).json({hello: 'hello'});
});

router.get('/:id', (req: Request, res: Response) => {
    res.status(200).json({hello: 'hello'});
});

router.put('/:id', (req: Request, res: Response) => {
    res.status(200).json({hello: 'hello'});
});

router.delete('/:id', (req: Request, res: Response) => {
    res.status(200).json({hello: 'hello'});
});

router.delete('/byName/:name', (req: Request, res: Response) => {
    res.status(200).json({hello: 'hello'});
});

export = router;