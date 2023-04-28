import express from 'express';
import { process_urls, calc_final_result, OutputObject }  from '../../package-metrics/src/index';
import { Request, Response } from 'express';
import { prisma } from '../../clients';

const router = express.Router();

router.get('/:id/rate', async (req: Request, res: Response) => {
    logger.log('info', 'Rating package...');
    const pkg = await prisma.package.findUnique({
        where: {
            id: parseInt(req.params.id)
        }
    });

    if (!pkg) {
        res.status(404).end();
        logger.log('info', 'Package not found.');
        return;
    }

    try {
        //var url_vals:string[] = await get_file_lines('../sample_url_file copy.txt');
        const rating: OutputObject[] = await process_urls([pkg.url], calc_final_result);
        res.status(200).json(rating[0]);
        logger.log('info', 'Package rated.');
    } catch {
        res.status(500).end();
        logger.log('error', 'Error rating package!');
    }
});

export = router;