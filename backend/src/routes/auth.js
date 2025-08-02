const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
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

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    if (user) {
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();
      
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          points: user.points,
          role: user.role,
          token,
          refreshToken
        }
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Invalid user data' 
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();
      
      res.json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          points: user.points,
          role: user.role,
          token,
          refreshToken
        }
      });
    } else {
      res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('categoryOfInterest');
    
    if (user) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          points: user.points,
          role: user.role,
          categoryOfInterest: user.categoryOfInterest
        }
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
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

    const { firstName, lastName, email, categoryOfInterest, role } = req.body;

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is already taken' 
      });
    }

    // Build update object
    const updateData = {
      firstName,
      lastName,
      email
    };

    // Only allow admins to update roles
    if (role && req.user.role === 'admin') {
      updateData.role = role;
    }

    // Update category of interest
    if (categoryOfInterest) {
      updateData.categoryOfInterest = categoryOfInterest;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryOfInterest');

    if (user) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          categoryOfInterest: user.categoryOfInterest
        }
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
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

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Find user with this refresh token
    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid refresh token' 
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid refresh token' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router; 