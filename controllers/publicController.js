import Business from '../models/Business.js';
import Test from '../models/Test.js';

// @desc    Get all active labs/businesses
// @route   GET /api/public/labs
// @access  Public
export const getLabs = async (req, res) => {
    try {
        const { city, pincode, search } = req.query;

        // 1. Build business query
        let businessQuery = {};
        if (city) {
            businessQuery['address.city'] = { $regex: city, $options: 'i' };
        }
        if (pincode) {
            businessQuery['address.pincode'] = pincode;
        }

        // Fetch matching businesses
        const businesses = await Business.find(businessQuery).select('_id businessName profileImage rating reviews address');
        const businessIds = businesses.map(b => b._id);

        // 2. Build test query
        let testQuery = {
            business: { $in: businessIds },
            isActive: true
        };

        if (search) {
            testQuery.name = { $regex: search, $options: 'i' };
        }

        // Fetch all tests for these businesses
        const tests = await Test.find(testQuery)
            .populate('business', 'businessName profileImage rating reviews address')
            .populate('category', 'name')
            .populate('subCategories', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Transform for frontend cards
        const testsWithLabInfo = tests.map(test => ({
            _id: test._id,
            name: test.name,
            price: test.price,
            images: test.images,
            category: test.category?.name,
            subCategories: test.subCategories?.map(sc => sc.name),
            businessId: test.business?._id,
            businessName: test.business?.businessName,
            businessLogo: test.business?.profileImage,
            rating: test.business?.rating,
            reviews: test.business?.reviews,
            address: test.business?.address
        }));

        res.json({
            success: true,
            data: testsWithLabInfo
        });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tests'
        });
    }
};

// @desc    Get specific lab details with tests
// @route   GET /api/public/labs/:id
// @access  Public
export const getLabDetails = async (req, res) => {
    try {
        const businessId = req.params.id;

        // Fetch Business Details
        const business = await Business.findById(businessId)
            .select('-password -otp -otpExpiry') // Exclude sensitive info
            .lean();

        if (!business) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        // Fetch Tests for this Lab
        const tests = await Test.find({ business: businessId, isActive: true })
            .populate('category', 'name')
            .populate('subCategories', 'name')
            .sort({ category: 1, name: 1 })
            .lean();

        res.json({
            success: true,
            data: {
                lab: business,
                tests: tests
            }
        });
    } catch (error) {
        console.error('Error fetching lab details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lab details'
        });
    }
};

// @desc    Get specific test details
// @route   GET /api/public/tests/:id
// @access  Public
export const getTestDetails = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('business', '-password -otp -otpExpiry')
            .populate('category', 'name')
            .populate('subCategories', 'name')
            .lean();

        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        res.json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error('Error fetching test details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching test details'
        });
    }
};

// @desc    Get similar tests (same category, same city)
// @route   GET /api/public/tests/:id/similar
// @access  Public
export const getSimilarTests = async (req, res) => {
    try {
        const testId = req.params.id;
        const currentTest = await Test.findById(testId).populate('business');

        if (!currentTest) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        const city = currentTest.business.address.city;
        const categoryId = currentTest.category;

        // Find other businesses in the same city
        const nearbyBusinesses = await Business.find({
            'address.city': { $regex: new RegExp(`^${city}$`, 'i') }
        }).select('_id');
        const businessIds = nearbyBusinesses.map(b => b._id);

        // Find tests in the same category from these businesses
        const similarTests = await Test.find({
            _id: { $ne: testId },
            category: categoryId,
            business: { $in: businessIds },
            isActive: true
        })
            .populate('business', 'businessName profileImage rating reviews address')
            .limit(10)
            .lean();

        // Transform for carousel
        const transformed = similarTests.map(t => ({
            id: t._id,
            name: t.business?.businessName,
            testName: t.name,
            price: t.price,
            image: t.images?.[0] || t.business?.profileImage,
            rating: t.business?.rating,
            reviews: t.business?.reviews
        }));

        res.json({
            success: true,
            data: transformed
        });
    } catch (error) {
        console.error('Error fetching similar tests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching similar tests'
        });
    }
};
