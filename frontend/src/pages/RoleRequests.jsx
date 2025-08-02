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
        <h1 className="text-3xl font-bold text-base-content">Role Requests</h1>
        <p className="text-base-content/70 mt-2">
          Manage user requests for role changes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-base-200 rounded-lg p-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="select select-bordered"
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
      <div className="bg-base-200 rounded-lg p-6">
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
                            className="btn btn-sm btn-primary"
                            title="Review Request"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(request._id)}
                        className="btn btn-sm btn-error"
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
            <UserPlus className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">No role requests found</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="modal modal-open">
          <div className="modal-box">
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
                  className="select select-bordered w-full"
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
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  placeholder="Add notes about your decision..."
                  maxLength={500}
                />
              </div>
            </div>
            
            <div className="modal-action">
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewMutation.isLoading}
                className="btn btn-primary"
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