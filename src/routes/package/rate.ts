import express from 'express';
import { process_urls, calc_final_result, get_file_lines, OutputObject }  from '../../../package-metrics/src/index';
import { Request, Response } from 'express';

const router = express.Router();

router.get('/:id/rate', async (req: Request, res: Response) => {
    //TODO: once we have a database with packages, need to have this get the url associated with the package id,
    //for now it's set up to get the url from a file.
    //await process_urls(filename, calc_final_result);
    var url_vals:string[] = await get_file_lines('sample_url_file copy.txt');
    var rating:OutputObject[] = await process_urls(url_vals, calc_final_result);

    res.status(200).json(rating[0]);
});

export = router;