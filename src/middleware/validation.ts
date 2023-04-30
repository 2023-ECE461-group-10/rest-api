import { Request, Response, NextFunction } from 'express';

function isValidNumber(value: number) {
    return value != undefined && !isNaN(value) && isFinite(value);
}

function ValidateParamIsNumberElse(paramName: string, statusCode: number)  {
    return (req: Request, res: Response, next: NextFunction) => {
        const num = parseInt(req.params[paramName]);
        if (!isValidNumber(num)) {
            logger.log('info', `${paramName} is not a valid number`);
            res.status(statusCode).end();
            return;
        }
        next();
    };
}

export {
    isValidNumber,
    ValidateParamIsNumberElse
}