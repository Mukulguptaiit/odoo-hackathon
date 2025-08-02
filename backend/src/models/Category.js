const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPredefined: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });

// Virtual for creator name
categorySchema.virtual('creatorName', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
  get: function() {
    return this.populated('createdBy') ? 
      `${this.populated('createdBy')?.firstName} ${this.populated('createdBy')?.lastName}` : 
      undefined;
  }
});

// Ensure virtuals are serialized
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema); 