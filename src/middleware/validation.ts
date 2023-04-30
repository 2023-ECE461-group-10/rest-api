import { Request, Response, NextFunction } from 'express';

function ValidateParamIsNumberElse(paramName: string, statusCode: number)  {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!parseInt(req.params[paramName])) {
            logger.log('info', `${paramName} must be a number`);
            res.status(statusCode).end();
            return;
        }
        next();
    };
}

export {
    ValidateParamIsNumberElse
}