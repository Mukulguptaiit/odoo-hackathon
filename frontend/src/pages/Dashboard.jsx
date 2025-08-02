import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaTicketAlt, FaCheckCircle, FaClock, FaExclamationTriangle, 
  FaChartBar, FaPlus, FaUsers, FaComments, FaBell 
} from 'react-icons/fa';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    answeredQuestions: 0,
    unansweredQuestions: 0,
    categoryBreakdown: [],
    recentTickets: []
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch tickets for stats
      const ticketsResponse = await api.get('/tickets', { 
        params: { 
          limit: 1000, // Get all tickets for stats
          page: 1 
        } 
      });
      
      const allTickets = ticketsResponse.data.tickets;
      
      // Calculate stats
      const totalQuestions = allTickets.length;
      const answeredQuestions = allTickets.filter(t => 
        ['resolved', 'closed'].includes(t.status)
      ).length;
      const unansweredQuestions = totalQuestions - answeredQuestions;

      // Category breakdown
      const categoryMap = {};
      allTickets.forEach(ticket => {
        if (ticket.category) {
          const categoryName = ticket.category.name;
          categoryMap[categoryName] = (categoryMap[categoryName] || 0) + 1;
        }
      });

      const categoryBreakdown = Object.entries(categoryMap).map(([name, count]) => ({
        name,
        count,
        color: getCategoryColor(name)
      }));

      setStats({
        totalQuestions,
        answeredQuestions,
        unansweredQuestions,
        categoryBreakdown,
        recentTickets: allTickets.slice(0, 5) // Get 5 most recent tickets
      });

      // Show notification if there are new tickets
      if (totalQuestions > 0) {
        setNotification(`Welcome back! You have ${totalQuestions} total questions in the system.`);
        setTimeout(() => setNotification(''), 5000);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryName) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
    ];
    const index = categoryName.length % colors.length;
    return colors[index];
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Notification */}
      {notification && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <FaBell className="text-blue-500" />
          {notification}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user.firstName}! Here's your help desk overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaTicketAlt className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaCheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Answered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.answeredQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unanswered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unansweredQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaChartBar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.categoryBreakdown.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Breakdown by Category</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.categoryBreakdown.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${category.color} mr-3`}></div>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-700">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/create-ticket"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Ask Your Question
          </Link>
          <Link
            to="/tickets"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaComments className="mr-2" />
            View All Questions
          </Link>
          {user.role === 'support_agent' && (
            <Link
              to="/tickets?assignedTo=me"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaUsers className="mr-2" />
              My Assigned Questions
            </Link>
          )}
        </div>
      </div>

      {/* Recent Questions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Questions</h2>
        </div>
        
        {stats.recentTickets.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FaTicketAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg">No questions yet</p>
            <p className="text-sm mt-2">Ask your first question to get started</p>
            <Link
              to="/create-ticket"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-4"
            >
              <FaPlus className="mr-2" />
              Ask Question
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stats.recentTickets.map(ticket => (
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
                        {ticket.status.replace('_', ' ')}
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
                  
                  <Link
                    to={`/tickets/${ticket._id}`}
                    className="ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FaComments />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {stats.recentTickets.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <Link
              to="/tickets"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all questions →
            </Link>
          </div>
        )}
      </div>

      {/* Role-specific sections */}
      {user.role === 'support_agent' && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <h3 className="text-lg font-medium text-yellow-800">Support Agent Tips</h3>
          </div>
          <ul className="mt-3 text-sm text-yellow-700 space-y-1">
            <li>• Check unassigned questions regularly</li>
            <li>• Update question status as you work on them</li>
            <li>• Use internal comments for team communication</li>
            <li>• Respond to questions within 24 hours</li>
          </ul>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <FaUsers className="h-5 w-5 text-blue-600 mr-3" />
            <h3 className="text-lg font-medium text-blue-800">Admin Actions</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <Link
              to="/admin"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Manage Users
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Manage Categories
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              View Reports
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 