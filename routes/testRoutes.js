import express from 'express';
import { protectBusiness } from '../middleware/businessAuth.js';
import { upload } from '../middleware/upload.js';
import {
    addTest,
    getMyTests,
    updateTest,
    deleteTest,
    toggleTestStatus
} from '../controllers/testController.js';

const router = express.Router();

// Apply protection to all routes
router.use(protectBusiness);

router.route('/')
    .post(upload.array('images', 2), addTest) // Allow up to 2 images
    .get(getMyTests);

router.route('/:id')
    .put(upload.array('images', 2), updateTest)
    .delete(deleteTest);

router.patch('/:id/toggle', toggleTestStatus);

export default router;
