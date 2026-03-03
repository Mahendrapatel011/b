import Cart from '../models/Cart.js';
import Test from '../models/Test.js';

// @desc    Get customer cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ customer: req.customer._id })
            .populate({
                path: 'items.test',
                populate: {
                    path: 'business',
                    select: 'businessName profileImage rating reviews'
                }
            });

        if (!cart) {
            cart = await Cart.create({ customer: req.customer._id, items: [] });
        }

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
    try {
        const { testId } = req.body;

        let cart = await Cart.findOne({ customer: req.customer._id });

        if (!cart) {
            cart = new Cart({ customer: req.customer._id, items: [] });
        }

        // Check if test exists
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        // Check if already in cart
        const itemExists = cart.items.find(item => item.test.toString() === testId);
        if (itemExists) {
            return res.status(400).json({ success: false, message: 'Test already in cart' });
        }

        cart.items.push({ test: testId, isSelected: true });
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.test',
            populate: {
                path: 'business',
                select: 'businessName profileImage rating reviews'
            }
        });

        res.json({
            success: true,
            data: updatedCart
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:testId
// @access  Private
export const removeFromCart = async (req, res) => {
    try {
        const { testId } = req.params;

        const cart = await Cart.findOne({ customer: req.customer._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.test.toString() !== testId);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.test',
            populate: {
                path: 'business',
                select: 'businessName profileImage rating reviews'
            }
        });

        res.json({
            success: true,
            data: updatedCart
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Toggle item selection
// @route   PATCH /api/cart/toggle/:testId
// @access  Private
export const toggleSelection = async (req, res) => {
    try {
        const { testId } = req.params;

        const cart = await Cart.findOne({ customer: req.customer._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.items.find(i => i.test.toString() === testId);
        if (item) {
            item.isSelected = !item.isSelected;
            await cart.save();
        }

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.test',
            populate: {
                path: 'business',
                select: 'businessName profileImage rating reviews'
            }
        });

        res.json({
            success: true,
            data: updatedCart
        });
    } catch (error) {
        console.error('Error toggling selection:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ customer: req.customer._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
