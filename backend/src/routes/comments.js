const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const { protect, supportAgent } = require('../middleware/auth');

// Get comments for a ticket
router.get('/ticket/:ticketId', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Build query based on user role
    let query = { ticket: req.params.ticketId };
    
    // End users can only see public comments
    if (req.user.role === 'end_user') {
      query.isInternal = false;
    }
    // Support agents and admins can see all comments
    // (no additional filter needed)

    const comments = await Comment.find(query)
      .populate('author', 'firstName lastName role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// Create a comment
router.post('/', protect, async (req, res) => {
  try {
    const { ticketId, content, isInternal = false } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    if (isInternal && req.user.role === 'end_user') {
      return res.status(403).json({ message: 'End users cannot create internal comments' });
    }

    // End users can only comment on their own tickets
    if (req.user.role === 'end_user' && ticket.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only comment on your own tickets' });
    }

    const comment = new Comment({
      ticket: ticketId,
      author: req.user._id,
      content,
      isInternal
    });

    await comment.save();
    await comment.populate('author', 'firstName lastName role');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
});

// Update a comment
router.put('/:id', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check permissions
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    comment.content = content;
    await comment.save();
    await comment.populate('author', 'firstName lastName role');

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating comment', error: error.message });
  }
});

// Delete a comment
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check permissions
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
});

// Vote on a comment
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user._id;

    if (voteType === 'upvote') {
      // Remove from downvotes if exists
      comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId.toString());
      
      // Toggle upvote
      if (comment.upvotes.includes(userId)) {
        comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId.toString());
      } else {
        comment.upvotes.push(userId);
      }
    } else if (voteType === 'downvote') {
      // Remove from upvotes if exists
      comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId.toString());
      
      // Toggle downvote
      if (comment.downvotes.includes(userId)) {
        comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId.toString());
      } else {
        comment.downvotes.push(userId);
      }
    }

    await comment.save();
    await comment.populate('author', 'firstName lastName role');

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error voting on comment', error: error.message });
  }
});

module.exports = router; 