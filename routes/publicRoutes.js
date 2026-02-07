import express from 'express';
import { getLabs, getLabDetails, getTestDetails, getSimilarTests } from '../controllers/publicController.js';

const router = express.Router();

router.get('/labs', getLabs);
router.get('/labs/:id', getLabDetails);
router.get('/tests/:id', getTestDetails);
router.get('/tests/:id/similar', getSimilarTests);

export default router;
