import express from 'express';
import {
    getBusinesses,
    updateBusinessKYCStatus,
    getCustomers,
    deleteBusiness,
    deleteCustomer
} from '../controllers/adminController.js';
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import {
    createSubCategory,
    getSubCategories,
    updateSubCategory,
    deleteSubCategory
} from '../controllers/subCategoryController.js';
import {
    createMasterTest,
    getMasterTests,
    updateMasterTest,
    deleteMasterTest
} from '../controllers/masterTestController.js';

const router = express.Router();

// Ideal place for 'adminAuth' middleware

// Business Routes
router.get('/businesses', getBusinesses);
router.put('/business/:id/kyc-status', updateBusinessKYCStatus);
router.delete('/business/:id', deleteBusiness);

// Customer Routes
router.get('/customers', getCustomers);
router.delete('/customer/:id', deleteCustomer);

// Category Routes
router.route('/categories').post(createCategory).get(getCategories);
router.route('/categories/:id').put(updateCategory).delete(deleteCategory);

// Sub Category Routes
router.route('/sub-categories').post(createSubCategory).get(getSubCategories);
router.route('/sub-categories/:id').put(updateSubCategory).delete(deleteSubCategory);

// Master Test Routes
router.route('/master-tests').post(createMasterTest).get(getMasterTests);
router.route('/master-tests/:id').put(updateMasterTest).delete(deleteMasterTest);

export default router;
