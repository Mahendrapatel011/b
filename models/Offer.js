import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Offer title is required'],
        trim: true
    },
    applicableTests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
    }],
    isAllTests: {
        type: Boolean,
        default: false
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    eligibility: {
        firstTimeOnly: {
            type: Boolean,
            default: false
        },
        minOrderValue: {
            type: Number,
            default: 0
        }
    },
    offerCode: {
        type: String,
        trim: true
    },
    bannerImage: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        bookings: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Middleware to set isActive or status (can be done at query time too)
offerSchema.virtual('status').get(function () {
    const now = new Date();
    if (now < this.startDate) return 'scheduled';
    if (now > this.endDate) return 'expired';
    return this.isActive ? 'active' : 'inactive';
});

offerSchema.set('toJSON', { virtuals: true });
offerSchema.set('toObject', { virtuals: true });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
