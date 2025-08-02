const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 
      'accessories', 'bags', 'jewelry', 'other'
    ]
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: [
      'casual', 'formal', 'business', 'sportswear', 'vintage',
      'designer', 'streetwear', 'bohemian', 'minimalist', 'other'
    ]
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    enum: [
      'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
      'US 4', 'US 6', 'US 8', 'US 10', 'US 12', 'US 14', 'US 16',
      'EU 34', 'EU 36', 'EU 38', 'EU 40', 'EU 42', 'EU 44', 'EU 46',
      'UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18',
      'One Size', 'Custom'
    ]
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  pointsValue: {
    type: Number,
    required: [true, 'Points value is required'],
    min: [1, 'Points value must be at least 1'],
    max: [1000, 'Points value cannot exceed 1000']
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'available', 'swapped', 'redeemed'],
    default: 'pending'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
itemSchema.index({ uploader: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ type: 1 });
itemSchema.index({ isAvailable: 1 });
itemSchema.index({ createdAt: -1 });

// Virtual for full name
itemSchema.virtual('uploaderName', {
  ref: 'User',
  localField: 'uploader',
  foreignField: '_id',
  justOne: true,
  get: function() {
    return this.populated('uploader') ? 
      `${this.populated('uploader')?.firstName} ${this.populated('uploader')?.lastName}` : 
      undefined;
  }
});

// Ensure virtuals are serialized
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema); 