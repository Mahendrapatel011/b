import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        unique: true
    },
    items: [{
        test: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test',
            required: true
        },
        isSelected: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
