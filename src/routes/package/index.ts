import express from 'express';
import crud from './crud';
import rate from './rate';
import search from './search';

const router = express.Router();

router.use(crud);
router.use(rate);
router.use(search);

export = router;