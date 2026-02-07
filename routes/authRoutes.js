import express from 'express';
import {
    register,
    verifyOTP,
    login,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    resendOTP,
    getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOTP);

// Protected routes
router.get('/me', protect, getMe);

export default router;
