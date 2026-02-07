import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const businessSchema = new mongoose.Schema({
    // Basic Information
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true
    },
    ownerName: {
        type: String,
        required: [true, 'Owner name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },

    profileImage: {
        type: String,
        default: null
    },

    // Verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        select: false
    },
    otpExpiry: {
        type: Date,
        select: false
    },
    resetPasswordOtp: {
        type: String,
        select: false
    },
    resetPasswordOtpExpiry: {
        type: Date,
        select: false
    },

    // KYC Information
    kycStatus: {
        type: String,
        enum: ['pending', 'submitted', 'verified', 'rejected'],
        default: 'pending'
    },
    kycData: {
        gstNumber: String,
        panNumber: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        businessType: String,
        registrationNumber: String,
        documents: [{
            type: { type: String },
            url: String,
            proofType: String
        }]
    },

    // Additional Profile Details
    contactPerson: String,
    yearsOfExperience: String,

    // Address Details (Updated from Profile)
    address: {
        fullAddress: String,
        pincode: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' }
    },

    // Working Hours
    is24x7: {
        type: Boolean,
        default: false
    },
    workingHours: [{
        day: String,
        isOpen: Boolean,
        openingTime: String,
        closingTime: String,
        isClosed: Boolean
    }],

    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Hash password before saving
businessSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
businessSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
businessSchema.methods.generateOTP = function () {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.otp = otp;
    this.otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);
    return otp;
};

// Generate Reset Password OTP
businessSchema.methods.generateResetPasswordOTP = function () {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.resetPasswordOtp = otp;
    this.resetPasswordOtpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);
    return otp;
};

const Business = mongoose.model('Business', businessSchema);

export default Business;
