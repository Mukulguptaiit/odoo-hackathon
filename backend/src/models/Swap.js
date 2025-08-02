const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  itemRequested: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Requested item is required']
  },
  itemOffered: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  pointsOffered: {
    type: Number,
    min: [0, 'Points offered cannot be negative']
  },
  swapType: {
    type: String,
    enum: ['direct', 'points'],
    required: [true, 'Swap type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  acceptedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
swapSchema.index({ requester: 1 });
swapSchema.index({ itemRequested: 1 });
swapSchema.index({ status: 1 });
swapSchema.index({ createdAt: -1 });

// Virtual for requester name
swapSchema.virtual('requesterName', {
  ref: 'User',
  localField: 'requester',
  foreignField: '_id',
  justOne: true,
  get: function() {
    return this.populated('requester') ? 
      `${this.populated('requester')?.firstName} ${this.populated('requester')?.lastName}` : 
      undefined;
  }
});

// Ensure virtuals are serialized
swapSchema.set('toJSON', { virtuals: true });
swapSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Swap', swapSchema); 