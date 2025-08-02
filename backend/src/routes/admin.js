const express = require('express');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Category = require('../models/Category');
const RoleRequest = require('../models/RoleRequest');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, admin);

// @desc    Get tickets for admin view
// @route   GET /api/admin/tickets
// @access  Admin
router.get('/tickets', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const skip = (page - 1) * limit;
    
    const tickets = await Ticket.find(filter)
      .populate('creator', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(filter);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Delete ticket
// @route   DELETE /api/admin/tickets/:id
// @access  Admin
router.delete('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Get role requests
// @route   GET /api/admin/role-requests
// @access  Admin
router.get('/role-requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    
    const roleRequests = await RoleRequest.find(filter)
      .populate('user', 'firstName lastName email role')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RoleRequest.countDocuments(filter);

    res.json({
      success: true,
      data: roleRequests,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get role requests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete your own account' 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
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
      totalTickets,
      openTickets,
      pendingRoleRequests,
      totalCategories
    ] = await Promise.all([
      User.countDocuments(),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'open' }),
      RoleRequest.countDocuments({ status: 'pending' }),
      Category.countDocuments()
    ]);

    // Get recent activity
    const recentTickets = await Ticket.find()
      .populate('creator', 'firstName lastName')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentRoleRequests = await RoleRequest.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTickets,
          openTickets,
          pendingRoleRequests,
          totalCategories
        },
        recentActivity: {
          tickets: recentTickets,
          roleRequests: recentRoleRequests
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