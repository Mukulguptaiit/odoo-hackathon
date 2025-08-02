const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

// Get all predefined categories (categories of interest)
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find({ isPredefined: true, isActive: true })
      .sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get single category
router.get('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
});

// Get user's categories of interest
router.get('/user-interests', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('categoriesOfInterest');
    res.json(user.categoriesOfInterest || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user interests', error: error.message });
  }
});

// Update user's categories of interest
router.put('/user-interests', protect, async (req, res) => {
  try {
    const { categoryIds } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { categoriesOfInterest: categoryIds },
      { new: true }
    ).populate('categoriesOfInterest');

    res.json(user.categoriesOfInterest);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user interests', error: error.message });
  }
});

// Update category (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, description, color, isActive } = req.body;

    // Check if category name already exists (excluding current category)
    if (name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is being used by any tickets
    const Ticket = require('../models/Ticket');
    const ticketsUsingCategory = await Ticket.countDocuments({ category: req.params.id });
    
    if (ticketsUsingCategory > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It is being used by ${ticketsUsingCategory} ticket(s).` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router; 