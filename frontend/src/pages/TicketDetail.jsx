import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaArrowLeft, FaEdit, FaTrash, FaThumbsUp, FaThumbsDown, 
  FaPaperclip, FaDownload, FaEye, FaEyeSlash, FaReply, FaTimes, FaShare, FaCheckCircle 
} from 'react-icons/fa';
import api from '../services/api';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [showShareLink, setShowShareLink] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.ticket);
      setComments(response.data.comments);
      setEditData({
        subject: response.data.ticket.subject,
        description: response.data.ticket.description,
        category: response.data.ticket.category?._id || '',
        status: response.data.ticket.status
      });
    } catch (error) {
      setError('Error fetching question details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (itemId, voteType, itemType = 'ticket') => {
    try {
      const endpoint = itemType === 'comment' 
        ? `/tickets/comments/${itemId}/vote`
        : `/tickets/${itemId}/vote`;
      
      const response = await api.post(endpoint, { voteType });
      
      if (itemType === 'ticket') {
        setTicket(response.data);
      } else {
        setComments(prev => 
          prev.map(comment => 
            comment._id === itemId ? response.data : comment
          )
        );
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('content', newComment);
      formData.append('isInternal', isInternal);
      
      commentAttachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await api.post(`/tickets/${id}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setComments(prev => [...prev, response.data]);
      setNewComment('');
      setCommentAttachments([]);
      setIsInternal(false);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStats'] });
    } catch (error) {
      setError('Error adding comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTicket = async () => {
    try {
      setSubmitting(true);
      const response = await api.put(`/tickets/${id}`, editData);
      setTicket(response.data);
      setEditMode(false);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStats'] });
    } catch (error) {
      setError('Error updating question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await api.delete(`/tickets/${id}`);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStats'] });
      
      navigate('/tickets');
    } catch (error) {
      setError('Error deleting question');
    }
  };

  const handleCloseQuestion = async () => {
    try {
      const response = await api.put(`/tickets/${id}`, { status: 'closed' });
      setTicket(response.data);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStats'] });
    } catch (error) {
      setError('Error closing question');
    }
  };

  const handleFileSelect = (files) => {
    const newFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return false;
      }
      
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('File type not supported');
        return false;
      }
      
      return true;
    });

    setCommentAttachments(prev => [...prev, ...newFiles]);
    setError('');
  };

  const removeAttachment = (index) => {
    setCommentAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/tickets/${id}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Question not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 p-2 sm:p-0"
        >
          <FaArrowLeft />
          <span className="text-sm sm:text-base">Back to Questions</span>
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Question Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.subject}
                      onChange={(e) => setEditData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg sm:text-xl"
                    />
                  ) : (
                    ticket.subject
                  )}
                </h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full self-start ${getStatusColor(ticket.status)}`}>
                  {editMode ? (
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                      className="bg-transparent border-none focus:ring-0 text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  ) : (
                    ticket.status === 'open' ? 'Open' : ticket.status === 'closed' ? 'Closed' : ticket.status.replace('_', ' ')
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-4">
                <span>Asked by {ticket.creator ? `${ticket.creator.firstName} ${ticket.creator.lastName}` : 'Unknown User'}</span>
                <span className="hidden sm:inline">•</span>
                <span>{formatDate(ticket.createdAt)}</span>
                {ticket.category && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: ticket.category.color }}
                      ></div>
                      {ticket.category.name}
                    </span>
                  </>
                )}
              </div>

              {editMode ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2 ml-0 sm:ml-4">
              {/* Vote buttons */}
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                <button
                  onClick={() => handleVote(ticket._id, 'upvote')}
                  className={`p-2 rounded-lg transition-colors ${
                    ticket.upvotes?.some(vote => vote._id === user._id)
                      ? 'text-green-600 bg-green-100'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-100'
                  }`}
                >
                  <FaThumbsUp className="text-sm" />
                </button>
                <span className="text-sm text-gray-600 min-w-[24px] text-center font-medium">
                  {ticket.voteCount || (ticket.upvotes?.length || 0) - (ticket.downvotes?.length || 0)}
                </span>
                <button
                  onClick={() => handleVote(ticket._id, 'downvote')}
                  className={`p-2 rounded-lg transition-colors ${
                    ticket.downvotes?.some(vote => vote._id === user._id)
                      ? 'text-red-600 bg-red-100'
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-100'
                  }`}
                >
                  <FaThumbsDown className="text-sm" />
                </button>
              </div>

              {/* Action buttons container */}
              <div className="flex items-center gap-1">
                {/* Share Link Button (Support Agent/Admin only) */}
                {(user.role === 'support_agent' || user.role === 'admin') && (
                  <button
                    onClick={() => setShowShareLink(!showShareLink)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Share link"
                  >
                    <FaShare className="text-sm" />
                  </button>
                )}

                {/* Action buttons */}
                {(user.role === 'support_agent' || user.role === 'admin' || ticket.creator._id === user._id) && (
                  <>
                    {editMode ? (
                      <div className="flex gap-1">
                        <button
                          onClick={handleUpdateTicket}
                          disabled={submitting}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                    )}
                  </>
                )}

                {/* Close Question Button (Owner only) */}
                {ticket.creator._id === user._id && ticket.status !== 'closed' && (
                  <button
                    onClick={handleCloseQuestion}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Close question"
                  >
                    <FaCheckCircle className="text-sm" />
                  </button>
                )}

                {(user.role === 'admin' || ticket.creator._id === user._id) && (
                  <button
                    onClick={handleDeleteTicket}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Share Link (if visible) */}
          {showShareLink && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">Public Shareable Link</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generateShareLink()}
                  readOnly
                  className="flex-1 px-3 py-2 border border-green-300 rounded-lg bg-white text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generateShareLink())}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ticket.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${attachment.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaPaperclip className="text-gray-400 text-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700 truncate block">{attachment.filename}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
          </div>

          {/* Add Comment */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <form onSubmit={handleSubmitComment}>
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your reply..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  maxLength={2000}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {newComment.length}/2000 characters
                </p>
              </div>

              {/* Internal comment toggle (for support agents) */}
              {(user.role === 'support_agent' || user.role === 'admin') && (
                <div className="mb-4">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-700 leading-tight">Internal comment (not visible to end user)</span>
                  </label>
                </div>
              )}

              {/* File upload */}
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="block w-full text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                />
              </div>

              {/* Selected files */}
              {commentAttachments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <div className="space-y-2">
                    {commentAttachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center min-w-0 flex-1">
                          <FaPaperclip className="text-gray-400 mr-2 text-sm flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
                >
                  <FaReply className="text-sm" />
                  {submitting ? 'Adding...' : 'Add Reply'}
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          <div className="divide-y divide-gray-200">
            {comments.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-gray-500">
                No replies yet. Be the first to reply!
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 text-sm sm:text-base">
                          {comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : 'Unknown User'}
                        </span>
                        {comment.isInternal && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                            Internal
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 whitespace-pre-wrap mb-3 text-sm sm:text-base leading-relaxed">{comment.content}</p>

                      {/* Comment attachments */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mb-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {comment.attachments.map((attachment, index) => (
                              <a
                                key={index}
                                href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${attachment.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors min-w-0"
                              >
                                <FaPaperclip className="text-gray-400 text-xs flex-shrink-0" />
                                <span className="text-gray-700 truncate">{attachment.filename}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vote buttons */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                          <button
                            onClick={() => handleVote(comment._id, 'upvote', 'comment')}
                            className={`p-1 rounded transition-colors ${
                              comment.upvotes?.some(vote => vote._id === user._id)
                                ? 'text-green-600 bg-green-100'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-100'
                            }`}
                          >
                            <FaThumbsUp className="w-3 h-3" />
                          </button>
                          <span className="text-xs text-gray-600 min-w-[16px] text-center font-medium">
                            {comment.voteCount || (comment.upvotes?.length || 0) - (comment.downvotes?.length || 0)}
                          </span>
                          <button
                            onClick={() => handleVote(comment._id, 'downvote', 'comment')}
                            className={`p-1 rounded transition-colors ${
                              comment.downvotes?.some(vote => vote._id === user._id)
                                ? 'text-red-600 bg-red-100'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <FaThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail; 