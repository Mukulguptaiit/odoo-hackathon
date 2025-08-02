const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ticketSchema.index({ creator: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });

// Virtual for vote count
ticketSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for full creator name
ticketSchema.virtual('creatorName', {
  ref: 'User',
  localField: 'creator',
  foreignField: '_id',
  justOne: true,
  get: function() {
    return this.populated('creator') ? 
      `${this.populated('creator')?.firstName} ${this.populated('creator')?.lastName}` : 
      undefined;
  }
});

// Virtual for assigned agent name
ticketSchema.virtual('assignedAgentName', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true,
  get: function() {
    return this.populated('assignedTo') ? 
      `${this.populated('assignedTo')?.firstName} ${this.populated('assignedTo')?.lastName}` : 
      undefined;
  }
});

// Ensure virtuals are serialized
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema); 