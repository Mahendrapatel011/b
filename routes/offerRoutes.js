import express from 'express';
import { protectBusiness } from '../middleware/businessAuth.js';
import { upload } from '../middleware/upload.js';
import {
    addOffer,
    getMyOffers,
    updateOffer,
    deleteOffer
} from '../controllers/offerController.js';

const router = express.Router();

router.use(protectBusiness);

router.route('/')
    .post(upload.single('bannerImage'), addOffer)
    .get(getMyOffers);

router.route('/:id')
    .put(upload.single('bannerImage'), updateOffer)
    .delete(deleteOffer);

export default router;
