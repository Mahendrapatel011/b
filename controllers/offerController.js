import Offer from '../models/Offer.js';
import Test from '../models/Test.js';

// @desc    Add a new offer
// @route   POST /api/business/offers
// @access  Private (Business)
export const addOffer = async (req, res) => {
    try {
        const {
            title,
            applicableTests,
            isAllTests,
            discountType,
            discountValue,
            startDate,
            endDate,
            eligibility,
            offerCode
        } = req.body;

        let bannerImage = '';
        if (req.file) {
            bannerImage = `/uploads/${req.file.filename}`;
        }

        const offer = await Offer.create({
            business: req.business._id,
            title,
            applicableTests: isAllTests ? [] : applicableTests,
            isAllTests,
            discountType,
            discountValue,
            startDate,
            endDate,
            eligibility: eligibility ? JSON.parse(eligibility) : {},
            offerCode,
            bannerImage
        });

        res.status(201).json({
            success: true,
            data: offer
        });
    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding offer',
            error: error.message
        });
    }
};

// @desc    Get all offers for logged in business
// @route   GET /api/business/offers
// @access  Private (Business)
export const getMyOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ business: req.business._id })
            .populate('applicableTests', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: offers
        });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching offers'
        });
    }
};

// @desc    Update an offer
// @route   PUT /api/business/offers/:id
// @access  Private (Business)
export const updateOffer = async (req, res) => {
    try {
        let offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.business.toString() !== req.business._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (req.file) {
            req.body.bannerImage = `/uploads/${req.file.filename}`;
        }

        if (req.body.eligibility && typeof req.body.eligibility === 'string') {
            req.body.eligibility = JSON.parse(req.body.eligibility);
        }

        offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('applicableTests', 'name');

        res.json({
            success: true,
            data: offer
        });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating offer'
        });
    }
};

// @desc    Delete an offer
// @route   DELETE /api/business/offers/:id
// @access  Private (Business)
export const deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.business.toString() !== req.business._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await offer.deleteOne();

        res.json({
            success: true,
            message: 'Offer removed'
        });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting offer'
        });
    }
};
