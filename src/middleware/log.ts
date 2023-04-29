import { Request, Response, NextFunction } from 'express';

function LogRequestBody(req: Request, res: Response, next: NextFunction) {
    logger.log('debug', 'Request Body');
    logger.log('debug', req.body);
    next();
}

export {
    LogRequestBody
};
