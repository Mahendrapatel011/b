import Test from '../models/Test.js';
import Business from '../models/Business.js';

// @desc    Add a new test
// @route   POST /api/business/tests
// @access  Private (Business)
export const addTest = async (req, res) => {
    try {
        const { name, subtitle, category, subCategories, price, discount, homeCollection, preparation } = req.body;

        // Use business profile picture as default test image
        const business = await Business.findById(req.business._id);
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/${file.filename}`);
        } else if (business.profileImage) {
            images = [business.profileImage];
        }

        const test = await Test.create({
            business: req.business._id,
            name,
            subtitle,
            category,
            subCategories: Array.isArray(subCategories) ? subCategories : (subCategories ? [subCategories] : []),
            price,
            discount,
            images,
            homeCollection: homeCollection === 'true',
            preparation
        });

        // Populate for frontend
        const populatedTest = await Test.findById(test._id)
            .populate('category', 'name')
            .populate('subCategories', 'name');

        res.status(201).json({
            success: true,
            data: populatedTest
        });
    } catch (error) {
        console.error('Error adding test:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding test',
            error: error.message
        });
    }
};

// @desc    Get all tests for logged in business
// @route   GET /api/business/tests
// @access  Private (Business)
export const getMyTests = async (req, res) => {
    try {
        const tests = await Test.find({ business: req.business._id })
            .populate('category', 'name')
            .populate('subCategories', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: tests
        });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tests'
        });
    }
};

// @desc    Update a test
// @route   PUT /api/business/tests/:id
// @access  Private (Business)
export const updateTest = async (req, res) => {
    try {
        let test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        // Make sure user owns the test
        if (test.business.toString() !== req.business._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Image update logic removed as per requirement - test image is linked to business profile picture
        const business = await Business.findById(req.business._id);
        if (business && business.profileImage) {
            req.body.images = [business.profileImage];
        }

        test = await Test.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('category', 'name').populate('subCategories', 'name');

        res.json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error('Error updating test:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating test'
        });
    }
};

// @desc    Delete a test
// @route   DELETE /api/business/tests/:id
// @access  Private (Business)
export const deleteTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        if (test.business.toString() !== req.business._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await test.deleteOne();

        res.json({
            success: true,
            message: 'Test removed'
        });
    } catch (error) {
        console.error('Error deleting test:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting test'
        });
    }
};

// @desc    Toggle test status
// @route   PATCH /api/business/tests/:id/toggle
// @access  Private (Business)
export const toggleTestStatus = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        if (test.business.toString() !== req.business._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        test.isActive = !test.isActive;
        await test.save();

        res.json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error('Error toggling test status:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling test status'
        });
    }
};
