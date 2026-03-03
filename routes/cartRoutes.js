import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getCart,
    addToCart,
    removeFromCart,
    toggleSelection,
    clearCart
} from '../controllers/cartController.js';

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.delete('/remove/:testId', removeFromCart);
router.patch('/toggle/:testId', toggleSelection);
router.delete('/clear', clearCart);

export default router;
