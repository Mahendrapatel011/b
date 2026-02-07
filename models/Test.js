import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Test name is required'],
        trim: true
    },
    subtitle: {
        type: String,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: [true, 'At least one sub category is required']
    }],
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    images: [{
        type: String
    }],
    homeCollection: {
        type: Boolean,
        default: false
    },
    preparation: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Test = mongoose.model('Test', testSchema);

export default Test;
