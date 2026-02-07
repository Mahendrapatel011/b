import jwt from 'jsonwebtoken';
import Business from '../models/Business.js';

export const protectBusiness = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get business from token
            req.business = await Business.findById(decoded.id).select('-password');

            if (!req.business) {
                return res.status(401).json({
                    success: false,
                    message: 'Business not found'
                });
            }

            if (!req.business.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            next();
        } catch (error) {
            console.error('Business auth middleware error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};
