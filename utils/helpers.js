import jwt from 'jsonwebtoken';

// Generate JWT Token
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Validate email format
export const isValidEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
};

// Validate mobile format (10 digits)
export const isValidMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
};

// Validate password strength
export const isValidPassword = (password) => {
    // At least 6 characters, contains uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
};

// Send OTP (console log for now, can be replaced with SMS/Email service)
export const sendOTP = async (identifier, otp, type = 'email') => {
    console.log(`\n📧 OTP for ${identifier}: ${otp}`);
    console.log(`Type: ${type}`);
    console.log(`Expires in ${process.env.OTP_EXPIRE_MINUTES} minutes\n`);

    // TODO: Integrate with SMS/Email service
    // For now, just logging to console
    return true;
};
