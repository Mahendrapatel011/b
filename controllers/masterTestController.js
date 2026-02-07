import MasterTest from '../models/MasterTest.js';

// @desc    Create a new master test
// @route   POST /api/admin/master-tests
// @access  Private (Admin)
export const createMasterTest = async (req, res) => {
    try {
        const { name, category } = req.body;

        const masterTest = await MasterTest.create({
            name,
            category
        });

        res.status(201).json({
            success: true,
            data: masterTest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all master tests
// @route   GET /api/admin/master-tests
// @access  Public (to be used by business too)
export const getMasterTests = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) {
            query.category = category;
        }

        const masterTests = await MasterTest.find(query).populate('category', 'name');

        res.json({
            success: true,
            data: masterTests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update a master test
// @route   PUT /api/admin/master-tests/:id
// @access  Private (Admin)
export const updateMasterTest = async (req, res) => {
    try {
        const masterTest = await MasterTest.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!masterTest) {
            return res.status(404).json({ success: false, message: 'Master test not found' });
        }

        res.json({
            success: true,
            data: masterTest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete a master test
// @route   DELETE /api/admin/master-tests/:id
// @access  Private (Admin)
export const deleteMasterTest = async (req, res) => {
    try {
        const masterTest = await MasterTest.findByIdAndDelete(req.params.id);

        if (!masterTest) {
            return res.status(404).json({ success: false, message: 'Master test not found' });
        }

        res.json({
            success: true,
            message: 'Master test deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
