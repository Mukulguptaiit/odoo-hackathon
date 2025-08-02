import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, roleRequestsAPI } from '../services/api';
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Trash2
} from 'lucide-react';

const RoleRequests = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    adminNotes: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    page: 1
  });

  const queryClient = useQueryClient();

  const { data: roleRequests, isLoading } = useQuery({
    queryKey: ['roleRequests', filters],
    queryFn: () => adminAPI.getRoleRequests(filters).then(res => res.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => roleRequestsAPI.review(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roleRequests']);
      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewData({ status: 'approved', adminNotes: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roleRequestsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['roleRequests']);
    },
  });

  const handleReview = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedRequest) return;
    
    reviewMutation.mutate({
      id: selectedRequest._id,
      data: reviewData
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'badge-warning', icon: Clock },
      approved: { color: 'badge-success', icon: CheckCircle },
      rejected: { color: 'badge-error', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`badge ${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Requests</h1>
        <p className="text-gray-600 mt-2">
          Manage user requests for role changes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
                          <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Current Role</th>
                <th>Requested Role</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roleRequests?.data?.map((request) => (
                <tr key={request._id}>
                  <td>
                    <div>
                      <div className="font-medium">
                        {request.user?.firstName} {request.user?.lastName}
                      </div>
                      <div className="text-sm text-base-content/70">
                        {request.user?.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-outline">
                      {request.user?.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-primary">
                      {request.requestedRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="max-w-xs truncate" title={request.reason}>
                      {request.reason || 'No reason provided'}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(request.status)}
                  </td>
                  <td>
                    <div className="text-sm">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <>
                                                <button
                        onClick={() => handleReview(request)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        title="Review Request"
                      >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(request._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {roleRequests?.data?.length === 0 && (
          <div className="text-center py-8">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No role requests found</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-bold text-lg mb-4">Review Role Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">User</label>
                <p className="text-base">
                  {selectedRequest.user?.firstName} {selectedRequest.user?.lastName} ({selectedRequest.user?.email})
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Current Role</label>
                <span className="badge badge-outline">
                  {selectedRequest.user?.role?.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Requested Role</label>
                <span className="badge badge-primary">
                  {selectedRequest.requestedRole.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <p className="text-base bg-base-200 p-3 rounded">
                  {selectedRequest.reason || 'No reason provided'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Decision</label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={reviewData.adminNotes}
                  onChange={(e) => setReviewData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add notes about your decision..."
                  maxLength={500}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewMutation.isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {reviewMutation.isLoading ? 'Processing...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleRequests; 