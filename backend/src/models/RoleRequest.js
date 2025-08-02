const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const roleRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  requestedRole: {
    type: String,
    enum: ['support_agent', 'admin'],
    required: [true, 'Requested role is required']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
roleRequestSchema.index({ user: 1 });
roleRequestSchema.index({ status: 1 });
roleRequestSchema.index({ createdAt: -1 });

// Virtual for user name
roleRequestSchema.virtual('userName', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
  get: function() {
    return this.populated('user') ? 
      `${this.populated('user')?.firstName} ${this.populated('user')?.lastName}` : 
      undefined;
  }
});

// Virtual for reviewer name
roleRequestSchema.virtual('reviewerName', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true,
  get: function() {
    return this.populated('reviewedBy') ? 
      `${this.populated('reviewedBy')?.firstName} ${this.populated('reviewedBy')?.lastName}` : 
      undefined;
  }
});

// Ensure virtuals are serialized
roleRequestSchema.set('toJSON', { virtuals: true });
roleRequestSchema.set('toObject', { virtuals: true });

// Add pagination plugin
roleRequestSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('RoleRequest', roleRequestSchema); 