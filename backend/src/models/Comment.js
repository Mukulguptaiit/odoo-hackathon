const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Ticket is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  isInternal: {
    type: Boolean,
    default: false
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
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
commentSchema.index({ ticket: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ createdAt: -1 });

// Virtual for vote count
commentSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for author name
commentSchema.virtual('authorName', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true,
  get: function() {
    return this.populated('author') ? 
      `${this.populated('author')?.firstName} ${this.populated('author')?.lastName}` : 
      undefined;
  }
});

// Indexes for better query performance
commentSchema.index({ ticket: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ ticket: 1, createdAt: 1 });
commentSchema.index({ ticket: 1, isInternal: 1 });

// Ensure virtuals are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema); 