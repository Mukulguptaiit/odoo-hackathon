const express = require('express');
const { body, validationResult } = require('express-validator');
const Swap = require('../models/Swap');
const Item = require('../models/Item');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create swap request
// @route   POST /api/swaps
// @access  Private
router.post('/', protect, [
  body('itemRequested').notEmpty().withMessage('Requested item is required'),
  body('swapType').isIn(['direct', 'points']).withMessage('Invalid swap type'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long')
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

    const { itemRequested, itemOffered, pointsOffered, swapType, message } = req.body;

    // Check if requested item exists and is available
    const requestedItem = await Item.findById(itemRequested);
    if (!requestedItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Requested item not found' 
      });
    }

    if (!requestedItem.isAvailable || requestedItem.status !== 'available') {
      return res.status(400).json({ 
        success: false,
        message: 'Item is not available for swap' 
      });
    }

    // Check if user is trying to swap their own item
    if (requestedItem.uploader.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot swap your own item' 
      });
    }

    // Validate swap type specific requirements
    if (swapType === 'direct') {
      if (!itemOffered) {
        return res.status(400).json({ 
          success: false,
          message: 'Item offered is required for direct swap' 
        });
      }

      // Check if offered item exists and belongs to requester
      const offeredItem = await Item.findById(itemOffered);
      if (!offeredItem) {
        return res.status(404).json({ 
          success: false,
          message: 'Offered item not found' 
        });
      }

      if (offeredItem.uploader.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'You can only offer your own items' 
        });
      }

      if (!offeredItem.isAvailable || offeredItem.status !== 'available') {
        return res.status(400).json({ 
          success: false,
          message: 'Offered item is not available' 
        });
      }
    } else if (swapType === 'points') {
      if (!pointsOffered || pointsOffered <= 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Valid points value is required' 
        });
      }

      // Check if user has enough points
      if (req.user.points < pointsOffered) {
        return res.status(400).json({ 
          success: false,
          message: 'Insufficient points' 
        });
      }
    }

    // Check if swap already exists
    const existingSwap = await Swap.findOne({
      requester: req.user._id,
      itemRequested: itemRequested,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingSwap) {
      return res.status(400).json({ 
        success: false,
        message: 'Swap request already exists for this item' 
      });
    }

    const swap = await Swap.create({
      requester: req.user._id,
      itemRequested,
      itemOffered,
      pointsOffered,
      swapType,
      message
    });

    const populatedSwap = await Swap.findById(swap._id)
      .populate('requester', 'firstName lastName')
      .populate('itemRequested')
      .populate('itemOffered');

    res.status(201).json({
      success: true,
      data: populatedSwap
    });
  } catch (error) {
    console.error('Create swap error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Get user's swaps
// @route   GET /api/swaps
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const filter = { requester: req.user._id };
    if (status) filter.status = status;
    if (type) filter.swapType = type;

    const swaps = await Swap.find(filter)
      .populate('requester', 'firstName lastName')
      .populate('itemRequested')
      .populate('itemOffered')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: swaps
    });
  } catch (error) {
    console.error('Get swaps error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Get swap by ID
// @route   GET /api/swaps/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id)
      .populate('requester', 'firstName lastName email')
      .populate('itemRequested')
      .populate('itemOffered');

    if (!swap) {
      return res.status(404).json({ 
        success: false,
        message: 'Swap not found' 
      });
    }

    // Check if user is authorized to view this swap
    if (swap.requester._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this swap' 
      });
    }

    res.json({
      success: true,
      data: swap
    });
  } catch (error) {
    console.error('Get swap error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Update swap status (accept/reject/complete)
// @route   PUT /api/swaps/:id
// @access  Private
router.put('/:id', protect, [
  body('status').isIn(['accepted', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('message').optional().isLength({ max: 200 }).withMessage('Message too long')
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

    const { status, message } = req.body;
    const swap = await Swap.findById(req.params.id)
      .populate('itemRequested')
      .populate('itemOffered');

    if (!swap) {
      return res.status(404).json({ 
        success: false,
        message: 'Swap not found' 
      });
    }

    // Check if user is the item owner (for accept/reject) or swap requester (for cancel)
    const isItemOwner = swap.itemRequested.uploader.toString() === req.user._id.toString();
    const isRequester = swap.requester.toString() === req.user._id.toString();

    if (!isItemOwner && !isRequester) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this swap' 
      });
    }

    // Validate status transitions
    if (status === 'accepted' && !isItemOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Only item owner can accept swaps' 
      });
    }

    if (status === 'cancelled' && !isRequester) {
      return res.status(403).json({ 
        success: false,
        message: 'Only requester can cancel swaps' 
      });
    }

    // Update swap
    const updateData = { status };
    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledBy = req.user._id;
      updateData.cancelledReason = message;
    }

    const updatedSwap = await Swap.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('requester', 'firstName lastName')
     .populate('itemRequested')
     .populate('itemOffered');

    // Handle points transfer for completed swaps
    if (status === 'completed' && swap.swapType === 'points') {
      // Transfer points from requester to item owner
      await User.findByIdAndUpdate(swap.requester, {
        $inc: { points: -swap.pointsOffered }
      });
      
      await User.findByIdAndUpdate(swap.itemRequested.uploader, {
        $inc: { points: swap.pointsOffered }
      });

      // Mark items as swapped/redeemed
      await Item.findByIdAndUpdate(swap.itemRequested, {
        status: 'redeemed',
        isAvailable: false
      });
    }

    res.json({
      success: true,
      data: updatedSwap
    });
  } catch (error) {
    console.error('Update swap error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router; 