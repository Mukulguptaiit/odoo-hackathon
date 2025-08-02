const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendEmailNotification } = require('../utils/email');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Get all tickets with filtering and pagination
router.get('/', protect, cacheMiddleware(300), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      assignedTo,
      creator
    } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'end_user') {
      query.creator = req.user._id;
    } else if (req.user.role === 'support_agent') {
      // Support agents can see their assigned tickets and all open tickets
      if (assignedTo === 'me') {
        query.assignedTo = req.user._id;
      } else if (assignedTo === 'unassigned') {
        query.assignedTo = { $exists: false };
      }
    }

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (creator) query.creator = creator;

    // Search functionality
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tickets = await Ticket.find(query)
      .populate('creator', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('category', 'name color')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

// Get single ticket with comments
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('creator', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('category', 'name color')
      .populate('upvotes', 'firstName lastName')
      .populate('downvotes', 'firstName lastName');

    if (!ticket) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user can view this question
    if (req.user.role === 'end_user' && ticket.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get comments
    const comments = await Comment.find({ ticket: req.params.id })
      .populate('author', 'firstName lastName email role')
      .populate('upvotes', 'firstName lastName')
      .populate('downvotes', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.json({ ticket, comments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching question', error: error.message });
  }
});

// Create new ticket
router.post('/', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const { subject, description, category, priority = 'medium' } = req.body;

    // Validate category exists if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    })) : [];

    const ticket = new Ticket({
      subject,
      description,
      category,
      priority,
      creator: req.user._id,
      attachments
    });

    await ticket.save();

    // Populate references for response
    await ticket.populate('creator', 'firstName lastName email');
    await ticket.populate('category', 'name color');

    // Send email notification to support agents
    const supportAgents = await User.find({ role: 'support_agent', isActive: true });
    for (const agent of supportAgents) {
      await sendEmailNotification(agent.email, 'New Question Created', {
        ticketId: ticket._id,
        subject: ticket.subject,
        creator: `${req.user.firstName} ${req.user.lastName}`,
        category: categoryExists.name
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

// Update question
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check permissions
    if (req.user.role === 'end_user' && ticket.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { subject, description, category, priority, status, assignedTo } = req.body;

    // Only support agents and admins can change status and assignment
    if (req.user.role === 'end_user') {
      delete req.body.status;
      delete req.body.assignedTo;
    }

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    // Handle status changes
    if (status && status !== ticket.status) {
      if (status === 'resolved') {
        req.body.resolvedAt = new Date();
      } else if (status === 'closed') {
        req.body.closedAt = new Date();
      }
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('creator', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email')
     .populate('category', 'name color');

    // Send email notification for status changes
    if (status && status !== ticket.status) {
      await sendEmailNotification(ticket.creator.email, 'Question Status Updated', {
        ticketId: ticket._id,
        subject: ticket.subject,
        oldStatus: ticket.status,
        newStatus: status,
        updatedBy: `${req.user.firstName} ${req.user.lastName}`
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

// Add comment to question
router.post('/:id/comments', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user can comment on this question
    if (req.user.role === 'end_user' && ticket.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only comment on your own questions' });
    }

    const { content, isInternal = false } = req.body;

    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    })) : [];

    const comment = new Comment({
      ticket: req.params.id,
      author: req.user._id,
      content,
      isInternal,
      attachments
    });

    await comment.save();

    // Update ticket's updatedAt
    await Ticket.findByIdAndUpdate(req.params.id, { updatedAt: new Date() });

    // Populate references for response
    await comment.populate('author', 'firstName lastName email role');

    // Send email notification
    if (!isInternal) {
      const recipients = [ticket.creator];
      if (ticket.assignedTo) {
        recipients.push(ticket.assignedTo);
      }
      
      for (const recipient of recipients) {
        if (recipient.toString() !== req.user._id.toString()) {
          await sendEmailNotification(recipient.email, 'New Reply on Question', {
            ticketId: ticket._id,
            subject: ticket.subject,
            replyAuthor: `${req.user.firstName} ${req.user.lastName}`,
            replyContent: content
          });
        }
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// Vote on ticket
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const userId = req.user._id;
    const upvotes = ticket.upvotes.map(id => id.toString());
    const downvotes = ticket.downvotes.map(id => id.toString());

    if (voteType === 'upvote') {
      if (upvotes.includes(userId.toString())) {
        // Remove upvote
        ticket.upvotes = ticket.upvotes.filter(id => id.toString() !== userId.toString());
      } else {
        // Add upvote and remove downvote if exists
        if (!upvotes.includes(userId.toString())) {
          ticket.upvotes.push(userId);
        }
        ticket.downvotes = ticket.downvotes.filter(id => id.toString() !== userId.toString());
      }
    } else {
      if (downvotes.includes(userId.toString())) {
        // Remove downvote
        ticket.downvotes = ticket.downvotes.filter(id => id.toString() !== userId.toString());
      } else {
        // Add downvote and remove upvote if exists
        if (!downvotes.includes(userId.toString())) {
          ticket.downvotes.push(userId);
        }
        ticket.upvotes = ticket.upvotes.filter(id => id.toString() !== userId.toString());
      }
    }

    await ticket.save();
    await ticket.populate('upvotes', 'firstName lastName');
    await ticket.populate('downvotes', 'firstName lastName');

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error voting on question', error: error.message });
  }
});

// Vote on comment
router.post('/comments/:commentId/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user._id;
    const upvotes = comment.upvotes.map(id => id.toString());
    const downvotes = comment.downvotes.map(id => id.toString());

    if (voteType === 'upvote') {
      if (upvotes.includes(userId.toString())) {
        // Remove upvote
        comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId.toString());
      } else {
        // Add upvote and remove downvote if exists
        if (!upvotes.includes(userId.toString())) {
          comment.upvotes.push(userId);
        }
        comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId.toString());
      }
    } else {
      if (downvotes.includes(userId.toString())) {
        // Remove downvote
        comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId.toString());
      } else {
        // Add downvote and remove upvote if exists
        if (!downvotes.includes(userId.toString())) {
          comment.downvotes.push(userId);
        }
        comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId.toString());
      }
    }

    await comment.save();
    await comment.populate('author', 'firstName lastName email role');
    await comment.populate('upvotes', 'firstName lastName');
    await comment.populate('downvotes', 'firstName lastName');

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error voting on comment', error: error.message });
  }
});

// Delete question (only creator or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check permissions
    if (req.user.role === 'end_user' && ticket.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete associated comments
    await Comment.deleteMany({ ticket: req.params.id });

    // Delete question
    await Ticket.findByIdAndDelete(req.params.id);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

module.exports = router; 