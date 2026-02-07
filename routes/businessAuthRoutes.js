import express from 'express';
import {
    register,
    verifyOTP,
    login,
    verifyLoginOTP,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    resendOTP,
    getMe,
    submitKYC,
    updateProfileImage,
    updateProfile
} from '../controllers/businessAuthController.js';
import { protectBusiness } from '../middleware/businessAuth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOTP);

// Protected routes
router.post('/kyc', protectBusiness, upload.fields([
    { name: 'registrationCertificate', maxCount: 1 },
    { name: 'ownerAadhar', maxCount: 1 },
    { name: 'ownerIdProof', maxCount: 1 }
]), submitKYC);
router.put('/profile', protectBusiness, upload.fields([
    { name: 'businessCertificate', maxCount: 1 },
    { name: 'ownerIdProof', maxCount: 1 }
]), updateProfile);
router.put('/profile-image', protectBusiness, upload.single('profileImage'), updateProfileImage);
router.get('/me', protectBusiness, getMe);

export default router;
