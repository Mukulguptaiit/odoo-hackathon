import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaEnvelope, FaShieldAlt, FaGlobe, FaSave, FaSignOutAlt, FaArrowLeft, FaUserPlus, FaClock } from 'react-icons/fa';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [showRoleRequestForm, setShowRoleRequestForm] = useState(false);
  const [roleRequestData, setRoleRequestData] = useState({
    requestedRole: 'support_agent',
    reason: ''
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'end_user',
    category: '',
    language: 'en'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'end_user',
        category: user.category || '',
        language: user.language || 'en'
      });
    }
    fetchCategories();
    fetchRoleRequests();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRoleRequests = async () => {
    try {
      const response = await api.get('/role-requests/my-requests');
      setRoleRequests(response.data);
    } catch (error) {
      console.error('Error fetching role requests:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Only allow users to update certain fields based on their role
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };

      // Only support agents and admins can update category
      if (user.role === 'support_agent' || user.role === 'admin') {
        updateData.category = formData.category;
      }

      // Only admins can update roles
      if (user.role === 'admin') {
        updateData.role = formData.role;
      }

      await api.put('/auth/profile', updateData);
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = () => {
    // Toggle between languages
    const newLanguage = formData.language === 'en' ? 'es' : 'en';
    setFormData(prev => ({ ...prev, language: newLanguage }));
    setSuccess('Language changed successfully!');
  };

  const handleRoleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/role-requests', roleRequestData);
      setSuccess('Role request submitted successfully!');
      setShowRoleRequestForm(false);
      setRoleRequestData({ requestedRole: 'support_agent', reason: '' });
      fetchRoleRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting role request');
    } finally {
      setLoading(false);
    }
  };

  const canUpdateRole = user?.role === 'admin';
  const canUpdateCategory = user?.role === 'support_agent' || user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your profile details and preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                <FaUser className="inline mr-2" />
                Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <FaEnvelope className="inline mr-2" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                <FaShieldAlt className="inline mr-2" />
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={!canUpdateRole}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canUpdateRole ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="end_user">End User</option>
                <option value="support_agent">Support Agent</option>
                <option value="admin">Admin</option>
              </select>
              {!canUpdateRole && (
                <p className="mt-1 text-sm text-gray-500">
                  Only admins can change roles
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={!canUpdateCategory}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canUpdateCategory ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {!canUpdateCategory && (
                <p className="mt-1 text-sm text-gray-500">
                  Only support agents and admins can update categories
                </p>
              )}
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaGlobe className="inline mr-2" />
                Language
              </label>
              <button
                type="button"
                onClick={handleLanguageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                Change Language ({formData.language === 'en' ? 'English' : 'Español'})
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaSignOutAlt />
              Logout
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave />
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Role Request Section */}
      {user?.role === 'end_user' && (
        <div className="bg-white rounded-lg shadow-sm border mt-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaUserPlus />
              Role Change Request
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Request to become a Support Agent or Admin
            </p>
          </div>

          <div className="p-6">
            {!showRoleRequestForm ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> These roles provide additional permissions and access to support features.
                  </p>
                </div>

                <button
                  onClick={() => setShowRoleRequestForm(true)}
                  className="btn btn-primary"
                >
                  <FaUserPlus className="mr-2" />
                  Request Role Change
                </button>

                {/* Show existing requests */}
                {roleRequests.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Your Requests</h3>
                    <div className="space-y-3">
                      {roleRequests.map((request) => (
                        <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                Request to become: {request.requestedRole.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Status: <span className={`font-medium ${
                                  request.status === 'pending' ? 'text-yellow-600' :
                                  request.status === 'approved' ? 'text-green-600' :
                                  'text-red-600'
                                }`}>
                                  {request.status}
                                </span>
                              </p>
                              {request.reason && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Reason: {request.reason}
                                </p>
                              )}
                              {request.adminNotes && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Admin Notes: {request.adminNotes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleRoleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requested Role
                  </label>
                  <select
                    value={roleRequestData.requestedRole}
                    onChange={(e) => setRoleRequestData(prev => ({ ...prev, requestedRole: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="support_agent">Support Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Request
                  </label>
                  <textarea
                    value={roleRequestData.reason}
                    onChange={(e) => setRoleRequestData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please explain why you want this role change..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {roleRequestData.reason.length}/500 characters
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRoleRequestForm(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 