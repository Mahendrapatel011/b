import SubCategory from '../models/SubCategory.js';

// @desc    Create a new sub category
// @route   POST /api/admin/subcategories
// @access  Private/Admin
export const createSubCategory = async (req, res) => {
    try {
        const { name, categoryId } = req.body;

        const subCategoryExists = await SubCategory.findOne({ name, category: categoryId });

        if (subCategoryExists) {
            return res.status(400).json({ message: 'Sub Category already exists in this category' });
        }

        const subCategory = await SubCategory.create({
            name,
            category: categoryId,
            status: 'Active'
        });

        if (subCategory) {
            res.status(201).json({
                _id: subCategory._id,
                name: subCategory.name,
                category: subCategory.category,
                status: subCategory.status,
                message: 'Sub Category created successfully'
            });
        } else {
            res.status(400).json({ message: 'Invalid sub category data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all sub categories
// @route   GET /api/admin/subcategories
// @access  Private/Admin
export const getSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find({}).populate('category', 'name').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: subCategories
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update sub category
// @route   PUT /api/admin/subcategories/:id
// @access  Private/Admin
export const updateSubCategory = async (req, res) => {
    try {
        const { name, categoryId, status } = req.body;
        const subCategory = await SubCategory.findById(req.params.id);

        if (subCategory) {
            subCategory.name = name || subCategory.name;
            if (categoryId) subCategory.category = categoryId;
            subCategory.status = status || subCategory.status;

            const updatedSubCategory = await subCategory.save();
            res.json(updatedSubCategory);
        } else {
            res.status(404).json({ message: 'Sub Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete sub category
// @route   DELETE /api/admin/subcategories/:id
// @access  Private/Admin
export const deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);

        if (subCategory) {
            await subCategory.deleteOne();
            res.json({ message: 'Sub Category removed' });
        } else {
            res.status(404).json({ message: 'Sub Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
