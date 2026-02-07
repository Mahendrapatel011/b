import Business from '../models/Business.js';
import { generateToken, isValidEmail, isValidMobile, isValidPassword, sendOTP } from '../utils/helpers.js';

// @desc    Register new business
// @route   POST /api/business/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { businessName, ownerName, email, mobile, password, confirmPassword } = req.body;

        // Validation
        if (!businessName || !ownerName || !email || !mobile || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must include A-Z, a-z, 0-9, and special character'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email'
            });
        }

        if (!isValidMobile(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 10-digit mobile number'
            });
        }

        // Check if business already exists
        const existingBusiness = await Business.findOne({
            $or: [{ email }, { mobile }]
        });

        if (existingBusiness) {
            return res.status(400).json({
                success: false,
                message: 'Business with this email or mobile already exists'
            });
        }

        // Create business
        const business = await Business.create({
            businessName,
            ownerName,
            email,
            mobile,
            password,
            // Auto-verify to skip OTP requirement as requested
            isEmailVerified: true,
            isMobileVerified: true
        });

        // Generate OTP (still generating but not required for activation now)
        const otp = business.generateOTP();
        await business.save();

        // Send OTP to email (keeping this for notification, OR remove if totally off)
        // User said "otp off karwao", so maybe don't even send?
        // Let's send it but not require it for login/active status.
        await sendOTP(email, otp, 'email');

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                businessId: business._id,
                email: business.email,
                mobile: business.mobile
            }
        });

    } catch (error) {
        console.error('Business register error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during registration'
        });
    }
};

// @desc    Verify OTP after registration
// @route   POST /api/business/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and OTP'
            });
        }

        // Find business
        const business = await Business.findOne({ email }).select('+otp +otpExpiry');

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Check OTP
        if (!business.otp || business.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check OTP expiry
        if (business.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one'
            });
        }

        // Mark as verified
        business.isEmailVerified = true;
        business.isMobileVerified = true;
        business.otp = undefined;
        business.otpExpiry = undefined;
        await business.save();

        // Generate token
        const token = generateToken(business._id);

        res.status(200).json({
            success: true,
            message: 'Verification successful',
            data: {
                token,
                business: {
                    id: business._id,
                    businessName: business.businessName,
                    ownerName: business.ownerName,
                    email: business.email,
                    mobile: business.mobile,
                    kycStatus: business.kycStatus,
                    isApproved: business.isApproved
                }
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during OTP verification'
        });
    }
};

// @desc    Login business
// @route   POST /api/business/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email/mobile and password'
            });
        }

        // Determine if identifier is email or mobile
        const isEmail = isValidEmail(identifier);
        const isMobile = isValidMobile(identifier);

        if (!isEmail && !isMobile) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email or mobile number'
            });
        }

        // Find business
        const business = isEmail
            ? await Business.findOne({ email: identifier }).select('+password')
            : await Business.findOne({ mobile: identifier }).select('+password');

        if (!business) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await business.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is active
        if (!business.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support'
            });
        }

        // Check if email is verified (Skip this check if we are auto-verifying or if mobile login)
        // Since we auto-verify on register now, this check should generally pass.
        // But for legacy accounts or safety:
        // if (!business.isEmailVerified) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Please verify your email first'
        //     });
        // }

        // Logic to SKIP OTP for Mobile Login
        if (isMobile) {
            const token = generateToken(business._id);
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                requireOtp: false,
                data: {
                    token,
                    business: {
                        id: business._id,
                        businessName: business.businessName,
                        ownerName: business.ownerName,
                        email: business.email,
                        mobile: business.mobile,
                        kycStatus: business.kycStatus,
                        isApproved: business.isApproved
                    }
                }
            });
        }

        // Generate OTP for login (Email flow)
        const otp = business.generateOTP();
        await business.save();

        // Send OTP
        await sendOTP(identifier, otp, isEmail ? 'email' : 'sms');

        res.status(200).json({
            success: true,
            message: `OTP sent to your ${isEmail ? 'email' : 'mobile number'}`,
            requireOtp: true,
            data: {
                identifier
            }
        });

    } catch (error) {
        console.error('Business login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during login'
        });
    }
};

// @desc    Verify Login OTP
// @route   POST /api/business/auth/verify-login-otp
// @access  Public
export const verifyLoginOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide identifier and OTP'
            });
        }

        // Find business
        const isEmail = isValidEmail(identifier);
        const business = isEmail
            ? await Business.findOne({ email: identifier }).select('+otp +otpExpiry')
            : await Business.findOne({ mobile: identifier }).select('+otp +otpExpiry');

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Check OTP
        if (!business.otp || business.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check OTP expiry
        if (business.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one'
            });
        }

        // Clear OTP
        business.otp = undefined;
        business.otpExpiry = undefined;
        await business.save();

        // Generate token
        const token = generateToken(business._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                business: {
                    id: business._id,
                    businessName: business.businessName,
                    ownerName: business.ownerName,
                    email: business.email,
                    mobile: business.mobile,
                    kycStatus: business.kycStatus,
                    isApproved: business.isApproved
                }
            }
        });

    } catch (error) {
        console.error('Verify login OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during OTP verification'
        });
    }
};

// @desc    Forgot password - Send OTP
// @route   POST /api/business/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email or mobile number'
            });
        }

        // Determine if identifier is email or mobile
        const isEmail = isValidEmail(identifier);
        const isMobile = isValidMobile(identifier);

        if (!isEmail && !isMobile) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email or mobile number'
            });
        }

        // Find business
        const business = isEmail
            ? await Business.findOne({ email: identifier })
            : await Business.findOne({ mobile: identifier });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email or mobile number'
            });
        }

        // Generate reset password OTP
        const otp = business.generateResetPasswordOTP();
        await business.save();

        // Send OTP
        await sendOTP(identifier, otp, isEmail ? 'email' : 'sms');

        res.status(200).json({
            success: true,
            message: `OTP sent to your ${isEmail ? 'email' : 'mobile number'}`,
            data: {
                identifier: identifier,
                type: isEmail ? 'email' : 'mobile'
            }
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Verify reset password OTP
// @route   POST /api/business/auth/verify-reset-otp
// @access  Public
export const verifyResetOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide identifier and OTP'
            });
        }

        // Find business
        const isEmail = isValidEmail(identifier);
        const business = isEmail
            ? await Business.findOne({ email: identifier }).select('+resetPasswordOtp +resetPasswordOtpExpiry')
            : await Business.findOne({ mobile: identifier }).select('+resetPasswordOtp +resetPasswordOtpExpiry');

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Check OTP
        if (!business.resetPasswordOtp || business.resetPasswordOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check OTP expiry
        if (business.resetPasswordOtpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                identifier: identifier
            }
        });

    } catch (error) {
        console.error('Verify reset OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Reset password
// @route   POST /api/business/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const { identifier, otp, password, confirmPassword } = req.body;

        if (!identifier || !otp || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must include A-Z, a-z, 0-9, and special character'
            });
        }

        // Find business
        const isEmail = isValidEmail(identifier);
        const business = isEmail
            ? await Business.findOne({ email: identifier }).select('+resetPasswordOtp +resetPasswordOtpExpiry')
            : await Business.findOne({ mobile: identifier }).select('+resetPasswordOtp +resetPasswordOtpExpiry');

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Verify OTP again
        if (!business.resetPasswordOtp || business.resetPasswordOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (business.resetPasswordOtpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Update password
        business.password = password;
        business.resetPasswordOtp = undefined;
        business.resetPasswordOtpExpiry = undefined;
        await business.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful. Please login with your new password'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Resend OTP
// @route   POST /api/business/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
    try {
        const { identifier, type } = req.body; // type: 'registration' or 'reset'

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Please provide identifier'
            });
        }

        // Find business
        const isEmail = isValidEmail(identifier);
        const business = isEmail
            ? await Business.findOne({ email: identifier })
            : await Business.findOne({ mobile: identifier });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Generate new OTP
        let otp;
        if (type === 'reset') {
            otp = business.generateResetPasswordOTP();
        } else {
            otp = business.generateOTP();
        }
        await business.save();

        // Send OTP
        await sendOTP(identifier, otp, isEmail ? 'email' : 'sms');

        res.status(200).json({
            success: true,
            message: `New OTP sent to your ${isEmail ? 'email' : 'mobile number'}`
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Submit KYC documents
// @route   POST /api/business/auth/kyc
// @access  Private
export const submitKYC = async (req, res) => {
    try {
        const { panNumber, gstNumber, registrationNumber, idProofType, address, city, state, pincode } = req.body;
        const businessId = req.business._id;

        // Check if files are uploaded
        // req.files should contain: registrationCertificate, ownerAadhar, ownerIdProof
        const files = req.files;

        if (!files || Object.keys(files).length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Please upload all required documents'
            });
        }

        const business = await Business.findById(businessId);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Update KYC data
        business.kycData = {
            panNumber,
            gstNumber,
            registrationNumber,
            address,
            city,
            state,
            pincode,
            documents: [
                { type: 'registrationCertificate', url: files.registrationCertificate[0].path },
                { type: 'ownerAadhar', url: files.ownerAadhar[0].path },
                { type: 'ownerIdProof', url: files.ownerIdProof[0].path, proofType: idProofType }
            ]
        };
        business.kycStatus = 'submitted';

        await business.save();

        res.status(200).json({
            success: true,
            message: 'KYC submitted successfully. Pending approval.',
            data: {
                kycStatus: business.kycStatus
            }
        });

    } catch (error) {
        console.error('Submit KYC error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during KYC submission'
        });
    }
};

// @desc    Get current business profile
// @route   GET /api/business/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const business = await Business.findById(req.business._id);

        res.status(200).json({
            success: true,
            data: {
                business: {
                    id: business._id,
                    businessName: business.businessName,
                    ownerName: business.ownerName,
                    email: business.email,
                    mobile: business.mobile,
                    profileImage: business.profileImage,
                    kycStatus: business.kycStatus,
                    isApproved: business.isApproved,

                    // Profile Fields
                    contactPerson: business.contactPerson,
                    yearsOfExperience: business.yearsOfExperience,

                    // KYC Data (for pre-filling if needed)
                    kycData: business.kycData,

                    // Address & Hours
                    address: business.address,
                    workingHours: business.workingHours,
                    is24x7: business.is24x7,

                    createdAt: business.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Update business profile image
// @route   PUT /api/business/auth/profile-image
// @access  Private
export const updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }

        const business = await Business.findById(req.business._id);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Save file path
        business.profileImage = req.file.path;

        await business.save();

        res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            data: {
                // Ensure we return a normalized path or full URL if preferred, but raw path is okay if frontend handles it
                profileImage: business.profileImage
            }
        });

    } catch (error) {
        console.error('Update profile image error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Update business profile details
// @route   PUT /api/business/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        const business = await Business.findById(req.business._id);

        if (!business) {
            return res.status(404).json({ success: false, message: 'Business not found' });
        }

        // Basic Fields
        if (updates.labName) business.businessName = updates.labName;
        if (updates.email) business.email = updates.email;
        if (updates.mobileNumber) business.mobile = updates.mobileNumber;
        if (updates.ownerName) business.ownerName = updates.ownerName;
        if (updates.contactPerson) business.contactPerson = updates.contactPerson;
        if (updates.yearsOfExperience) business.yearsOfExperience = updates.yearsOfExperience;
        if (updates.is24x7 !== undefined) business.is24x7 = updates.is24x7 === 'true' || updates.is24x7 === true;

        // KYC Related fields (Syncing for convenience)
        if (!business.kycData) business.kycData = {};
        if (updates.panNumber) business.kycData.panNumber = updates.panNumber;
        if (updates.gstNumber) business.kycData.gstNumber = updates.gstNumber;

        // Handle Password Change
        if (updates.createPassword && updates.createPassword.length >= 6) {
            business.password = updates.createPassword;
        }

        // Address
        if (updates.address) {
            let addr = {};
            if (typeof updates.address === 'string') {
                try { addr = JSON.parse(updates.address); } catch (e) { }
            } else {
                addr = updates.address;
            }
            business.address = { ...business.address, ...addr };
        }

        // Working Hours
        if (updates.workingHours) {
            let hours = updates.workingHours;
            if (typeof hours === 'string') {
                try { hours = JSON.parse(hours); } catch (e) { }
            }
            business.workingHours = hours;
        }

        await business.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: business
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
