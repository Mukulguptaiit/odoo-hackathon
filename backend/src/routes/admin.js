const express = require('express');
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');
const User = require('../models/User');
const Swap = require('../models/Swap');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, admin);

// @desc    Get items for moderation
// @route   GET /api/admin/items
// @access  Admin
router.get('/items', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    
    const items = await Item.find(filter)
      .populate('uploader', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(filter);

    res.json({
      success: true,
      data: items,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get admin items error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Approve item
// @route   PUT /api/admin/items/:id/approve
// @access  Admin
router.put('/items/:id/approve', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Item is not pending approval' 
      });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'available',
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('uploader', 'firstName lastName')
     .populate('approvedBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedItem,
      message: 'Item approved successfully'
    });
  } catch (error) {
    console.error('Approve item error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Reject item
// @route   PUT /api/admin/items/:id/reject
// @access  Admin
router.put('/items/:id/reject', [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { reason } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Item is not pending approval' 
      });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectedReason: reason
      },
      { new: true }
    ).populate('uploader', 'firstName lastName');

    res.json({
      success: true,
      data: updatedItem,
      message: 'Item rejected successfully'
    });
  } catch (error) {
    console.error('Reject item error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Remove item
// @route   DELETE /api/admin/items/:id
// @access  Admin
router.delete('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Item removed successfully'
    });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalItems,
      pendingItems,
      totalSwaps,
      completedSwaps
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ status: 'pending' }),
      Swap.countDocuments(),
      Swap.countDocuments({ status: 'completed' })
    ]);

    // Get recent activity
    const recentItems = await Item.find()
      .populate('uploader', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentSwaps = await Swap.find()
      .populate('requester', 'firstName lastName')
      .populate('itemRequested', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalItems,
          pendingItems,
          totalSwaps,
          completedSwaps
        },
        recentActivity: {
          items: recentItems,
          swaps: recentSwaps
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router; 