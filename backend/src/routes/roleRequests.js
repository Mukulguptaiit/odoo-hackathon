const express = require('express');
const router = express.Router();
const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// Get all role requests (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'user', select: 'firstName lastName email role' },
        { path: 'reviewedBy', select: 'firstName lastName' }
      ],
      sort: { createdAt: -1 }
    };
    
    const roleRequests = await RoleRequest.paginate(query, options);
    
    res.json(roleRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching role requests', error: error.message });
  }
});

// Get user's own role requests
router.get('/my-requests', protect, async (req, res) => {
  try {
    const roleRequests = await RoleRequest.find({ user: req.user._id })
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(roleRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching role requests', error: error.message });
  }
});

// Create role request
router.post('/', protect, async (req, res) => {
  try {
    const { requestedRole, reason } = req.body;
    
    // Check if user already has a pending request
    const existingRequest = await RoleRequest.findOne({
      user: req.user._id,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending role request' 
      });
    }
    
    // Check if user is already in the requested role
    if (req.user.role === requestedRole) {
      return res.status(400).json({ 
        message: `You are already a ${requestedRole.replace('_', ' ')}` 
      });
    }
    
    const roleRequest = new RoleRequest({
      user: req.user._id,
      requestedRole,
      reason
    });
    
    await roleRequest.save();
    await roleRequest.populate('user', 'firstName lastName email role');
    
    res.status(201).json(roleRequest);
  } catch (error) {
    res.status(500).json({ message: 'Error creating role request', error: error.message });
  }
});

// Review role request (admin only)
router.put('/:id/review', protect, admin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    const roleRequest = await RoleRequest.findById(req.params.id)
      .populate('user', 'firstName lastName email role');
    
    if (!roleRequest) {
      return res.status(404).json({ message: 'Role request not found' });
    }
    
    if (roleRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Role request has already been reviewed' });
    }
    
    roleRequest.status = status;
    roleRequest.reviewedBy = req.user._id;
    roleRequest.reviewedAt = new Date();
    roleRequest.adminNotes = adminNotes;
    
    // If approved, update user's role
    if (status === 'approved') {
      const user = await User.findById(roleRequest.user._id);
      if (user) {
        user.role = roleRequest.requestedRole;
        await user.save();
      }
    }
    
    await roleRequest.save();
    await roleRequest.populate('reviewedBy', 'firstName lastName');
    
    res.json(roleRequest);
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing role request', error: error.message });
  }
});

// Delete role request (user can delete their own pending requests)
router.delete('/:id', protect, async (req, res) => {
  try {
    const roleRequest = await RoleRequest.findById(req.params.id);
    
    if (!roleRequest) {
      return res.status(404).json({ message: 'Role request not found' });
    }
    
    // Users can only delete their own pending requests, admins can delete any
    if (req.user.role !== 'admin' && roleRequest.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }
    
    if (req.user.role !== 'admin' && roleRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Can only delete pending requests' });
    }
    
    await RoleRequest.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Role request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting role request', error: error.message });
  }
});

module.exports = router; 