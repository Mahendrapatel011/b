import Business from '../models/Business.js';
import { sendOTP } from '../utils/helpers.js'; // Using sendOTP as a generic notification mechanism for now

// @desc    Get all businesses with optional kycStatus filter
// @route   GET /api/admin/businesses
// @access  Private (Admin)
export const getBusinesses = async (req, res) => {
    try {
        const { kycStatus } = req.query;
        let query = {};

        if (kycStatus) {
            query.kycStatus = kycStatus;
        }

        const businesses = await Business.find(query).select('-password -otp -otpExpiry').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: businesses.length,
            data: businesses
        });
    } catch (error) {
        console.error('Get businesses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving businesses'
        });
    }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private (Admin)
export const getCustomers = async (req, res) => {
    try {
        const customers = await import('../models/Customer.js').then(mod => mod.default.find().select('-password -otp -otpExpiry').sort({ createdAt: -1 }));

        res.status(200).json({
            success: true,
            count: customers.length,
            data: customers
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving customers'
        });
    }
};

// @desc    Delete Business
// @route   DELETE /api/admin/business/:id
// @access  Private (Admin)
export const deleteBusiness = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        await business.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Business deleted successfully'
        });
    } catch (error) {
        console.error('Delete business error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting business'
        });
    }
};

// @desc    Delete Customer
// @route   DELETE /api/admin/customer/:id
// @access  Private (Admin)
export const deleteCustomer = async (req, res) => {
    try {
        const Customer = await import('../models/Customer.js').then(mod => mod.default);
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        await customer.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting customer'
        });
    }
};

// @desc    Update Business KYC Status
// @route   PUT /api/admin/business/:id/kyc-status
// @access  Private (Admin)
export const updateBusinessKYCStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body; // status: 'verified', 'rejected'
        const businessId = req.params.id;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "verified" or "rejected"'
            });
        }

        const business = await Business.findById(businessId);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        business.kycStatus = status;
        if (status === 'verified') {
            business.isApproved = true;
        } else if (status === 'rejected') {
            business.isApproved = false;
        }

        await business.save();

        console.log(`Notification: Business ${business.email} KYC status updated to ${status}`);

        res.status(200).json({
            success: true,
            message: `Business KYC has been ${status}`,
            data: {
                id: business._id,
                kycStatus: business.kycStatus,
                isApproved: business.isApproved
            }
        });

    } catch (error) {
        console.error('Update KYC status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating KYC status'
        });
    }
};
