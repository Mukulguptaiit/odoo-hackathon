import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaSearch, FaFilter, FaEye, FaThumbsUp, FaThumbsDown, FaComments, FaShare } from 'react-icons/fa';
import { useTickets } from '../hooks/useTickets';
import { useCategories } from '../hooks/useCategories';
import { useDebounce } from '../hooks/useDebounce';

const TicketList = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    assignedTo: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(filters.search, 500);

  // Memoize the query parameters to prevent unnecessary re-renders
  const queryParams = useMemo(() => ({
    page: pagination.currentPage,
    limit: 10,
    status: filters.status,
    category: filters.category,
    search: debouncedSearch, // Use debounced search
    assignedTo: filters.assignedTo,
    ...(user.role === 'support_agent' && filters.assignedTo && { assignedTo: filters.assignedTo })
  }), [pagination.currentPage, filters.status, filters.category, debouncedSearch, filters.assignedTo, user.role]);

  // Use optimized hooks
  const { data: ticketsData, isLoading, error } = useTickets(queryParams);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Extract data from response
  const tickets = ticketsData?.tickets || [];
  const paginationData = {
    currentPage: ticketsData?.currentPage || 1,
    totalPages: ticketsData?.totalPages || 1,
    total: ticketsData?.total || 0
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleVote = async (ticketId, voteType) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/vote`, { voteType });
      // The vote will be reflected in the next data fetch due to cache invalidation
      // For immediate UI update, you could use queryClient.setQueryData
    } catch (error) {
      console.error('Error voting:', error);
    }
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

  if (isLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Questions & Answers</h1>
          <Link
            to="/create-ticket"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus />
            Ask Your Question
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Questions</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories?.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Category: {categories.find(c => c._id === filters.category)?.name}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                Search: {filters.search}
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-2 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Questions List */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No questions found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters or ask a new question</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tickets.map(ticket => (
                <div key={ticket._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          <Link to={`/tickets/${ticket._id}`} className="hover:text-blue-600">
                            {ticket.subject}
                          </Link>
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status === 'open' ? 'Open' : ticket.status === 'closed' ? 'Closed' : ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Asked by {ticket.creatorName}</span>
                        <span>• {formatDate(ticket.createdAt)}</span>
                        {ticket.category && (
                          <span className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: ticket.category.color }}
                            ></div>
                            {ticket.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {/* Vote buttons */}
                      <button
                        onClick={() => handleVote(ticket._id, 'upvote')}
                        className={`p-2 rounded-lg transition-colors ${
                          ticket.upvotes.some(vote => vote._id === user._id)
                            ? 'text-green-600 bg-green-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <FaThumbsUp />
                      </button>
                      <span className="text-sm text-gray-500 min-w-[20px] text-center">
                        {ticket.voteCount}
                      </span>
                      <button
                        onClick={() => handleVote(ticket._id, 'downvote')}
                        className={`p-2 rounded-lg transition-colors ${
                          ticket.downvotes.some(vote => vote._id === user._id)
                            ? 'text-red-600 bg-red-50'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <FaThumbsDown />
                      </button>
                      
                      {/* Action buttons */}
                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View conversations"
                      >
                        <FaComments />
                      </Link>
                      
                      {(user.role === 'support_agent' || user.role === 'admin') && (
                        <button
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Share link"
                        >
                          <FaShare />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {paginationData.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={paginationData.currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    page === paginationData.currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={paginationData.currentPage === paginationData.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList; 