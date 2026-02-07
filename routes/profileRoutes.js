import express from 'express';
import {
    getProfile,
    updateProfile,
    updateProfilePicture,
    changePassword,
    deleteAccount,
    permanentDeleteAccount,
    addEmail,
    addMobile,
    verifyAddition
} from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Profile routes
router.route('/')
    .get(getProfile)
    .put(updateProfile)
    .delete(deleteAccount);

// Profile picture
router.put('/picture', updateProfilePicture);

// Change password
router.put('/change-password', changePassword);

// Add email/mobile
router.post('/add-email', addEmail);
router.post('/add-mobile', addMobile);
router.post('/verify-addition', verifyAddition);

// Permanent delete
router.delete('/permanent', permanentDeleteAccount);

export default router;
