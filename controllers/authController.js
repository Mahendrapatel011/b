import Customer from '../models/Customer.js';
import { generateToken, isValidEmail, isValidMobile, isValidPassword, sendOTP } from '../utils/helpers.js';

// @desc    Register new customer
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { identifier, password, confirmPassword, name } = req.body;

        // Validation
        if (!identifier || !password || !confirmPassword || !name) {
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

        // Determine if identifier is email or mobile
        const isEmail = isValidEmail(identifier);
        const isMobile = isValidMobile(identifier);

        if (!isEmail && !isMobile) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email or 10-digit mobile number'
            });
        }

        // Check if customer already exists
        const existingCustomer = isEmail
            ? await Customer.findOne({ email: identifier })
            : await Customer.findOne({ mobile: identifier });

        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'This email or mobile is already registered'
            });
        }

        // Create customer
        const customerData = {
            name,
            password,
            ...(isEmail ? { email: identifier } : { mobile: identifier }),
            // Auto-verify mobile to skip OTP
            ...(isMobile ? { isMobileVerified: true } : {})
        };

        const customer = await Customer.create(customerData);

        // Generate OTP for verification (still logic exists but we auto-verify mobile)
        const otp = customer.generateOTP();
        await customer.save();

        // Send OTP
        await sendOTP(identifier, otp, isEmail ? 'email' : 'sms');

        res.status(201).json({
            success: true,
            // Changed message as requested
            message: 'Registration successful',
            data: {
                customerId: customer._id,
                identifier: identifier,
                type: isEmail ? 'email' : 'mobile'
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during registration'
        });
    }
};

// @desc    Verify OTP after registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide identifier and OTP'
            });
        }

        // Find customer
        const isEmail = isValidEmail(identifier);
        const customer = isEmail
            ? await Customer.findOne({ email: identifier }).select('+otp +otpExpiry')
            : await Customer.findOne({ mobile: identifier }).select('+otp +otpExpiry');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check OTP
        if (!customer.otp || customer.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check OTP expiry
        if (customer.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one'
            });
        }

        // Mark as verified
        if (isEmail) {
            customer.isEmailVerified = true;
        } else {
            customer.isMobileVerified = true;
        }

        customer.otp = undefined;
        customer.otpExpiry = undefined;
        await customer.save();

        // Generate token
        const token = generateToken(customer._id);

        res.status(200).json({
            success: true,
            message: 'Verification successful',
            data: {
                token,
                customer: {
                    id: customer._id,
                    email: customer.email,
                    mobile: customer.mobile,
                    name: customer.name,
                    isEmailVerified: customer.isEmailVerified,
                    isMobileVerified: customer.isMobileVerified
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

// @desc    Login customer
// @route   POST /api/auth/login
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

        // Find customer
        const customer = isEmail
            ? await Customer.findOne({ email: identifier }).select('+password')
            : await Customer.findOne({ mobile: identifier }).select('+password');

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await customer.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is active
        if (!customer.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support'
            });
        }

        // Logic to SKIP OTP for Mobile Login
        if (isMobile) {
            const token = generateToken(customer._id);
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                requireOtp: false,
                data: {
                    token,
                    customer: {
                        id: customer._id,
                        email: customer.email,
                        mobile: customer.mobile,
                        name: customer.name,
                        isEmailVerified: customer.isEmailVerified,
                        isMobileVerified: customer.isMobileVerified
                    }
                }
            });
        }

        // Generate OTP for login (Email flow)
        const otp = customer.generateOTP();
        await customer.save();

        // Send OTP
        await sendOTP(identifier, otp, 'email');

        res.status(200).json({
            success: true,
            message: `OTP sent to your email`,
            requireOtp: true,
            data: {
                identifier
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during login'
        });
    }
};

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
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

        // Find customer
        const customer = isEmail
            ? await Customer.findOne({ email: identifier })
            : await Customer.findOne({ mobile: identifier });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email or mobile number'
            });
        }

        // Generate reset password OTP
        const otp = customer.generateResetPasswordOTP();
        await customer.save();

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
// @route   POST /api/auth/verify-reset-otp
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

        // Find customer
        const isEmail = isValidEmail(identifier);
        const customer = isEmail
            ? await Customer.findOne({ email: identifier }).select('+resetPasswordOtp +resetPasswordOtpExpiry')
            : await Customer.findOne({ mobile: identifier }).select('+resetPasswordOtp +resetPasswordOtpExpiry');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check OTP
        if (!customer.resetPasswordOtp || customer.resetPasswordOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check OTP expiry
        if (customer.resetPasswordOtpExpiry < new Date()) {
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
// @route   POST /api/auth/reset-password
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

        // Find customer
        const isEmail = isValidEmail(identifier);
        const customer = isEmail
            ? await Customer.findOne({ email: identifier }).select('+resetPasswordOtp +resetPasswordOtpExpiry')
            : await Customer.findOne({ mobile: identifier }).select('+resetPasswordOtp +resetPasswordOtpExpiry');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Verify OTP again
        if (!customer.resetPasswordOtp || customer.resetPasswordOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (customer.resetPasswordOtpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Update password
        customer.password = password;
        customer.resetPasswordOtp = undefined;
        customer.resetPasswordOtpExpiry = undefined;
        await customer.save();

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
// @route   POST /api/auth/resend-otp
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

        // Find customer
        const isEmail = isValidEmail(identifier);
        const customer = isEmail
            ? await Customer.findOne({ email: identifier })
            : await Customer.findOne({ mobile: identifier });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Generate new OTP
        let otp;
        if (type === 'reset') {
            otp = customer.generateResetPasswordOTP();
        } else {
            otp = customer.generateOTP();
        }
        await customer.save();

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

// @desc    Get current customer profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id);

        res.status(200).json({
            success: true,
            data: {
                customer: {
                    id: customer._id,
                    email: customer.email,
                    mobile: customer.mobile,
                    name: customer.name,
                    isEmailVerified: customer.isEmailVerified,
                    isMobileVerified: customer.isMobileVerified,
                    createdAt: customer.createdAt
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
