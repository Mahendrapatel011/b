import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const customerSchema = new mongoose.Schema({
    email: {
        type: String,
        sparse: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    mobile: {
        type: String,
        sparse: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    name: {
        type: String,
        trim: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    age: {
        type: Number,
        min: 1,
        max: 120
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    address: {
        type: String,
        trim: true
    },
    profilePicture: {
        type: String, // URL or base64 string
        default: ''
    },
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
    isActive: {
        type: Boolean,
        default: true
    },
    deletionReason: {
        type: String,
        select: false
    },
    deletedAt: {
        type: Date,
        select: false
    }
}, {
    timestamps: true
});

// Ensure at least one identifier exists
customerSchema.pre('save', function (next) {
    if (!this.email && !this.mobile) {
        next(new Error('Either email or mobile number is required'));
    }
    next();
});

// Hash password before saving
customerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
customerSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
customerSchema.methods.generateOTP = function () {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.otp = otp;
    this.otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES) * 60 * 1000);
    return otp;
};

// Generate Reset Password OTP
customerSchema.methods.generateResetPasswordOTP = function () {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.resetPasswordOtp = otp;
    this.resetPasswordOtpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES) * 60 * 1000);
    return otp;
};

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
