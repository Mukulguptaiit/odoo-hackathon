import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../services/api'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { 
  Users, 
  Ticket, 
  Clock, 
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  UserPlus,
  Tag,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react'

const AdminDashboard = () => {
  const queryClient = useQueryClient()
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminAPI.getDashboard().then(res => res.data.data),
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => adminAPI.getCategories().then(res => res.data.data),
  })

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (categoryData) => adminAPI.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories'])
      queryClient.invalidateQueries(['categories'])
      toast.success('Category created successfully')
      setShowAddCategory(false)
      setCategoryForm({ name: '', description: '' })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create category')
    }
  })

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, ...data }) => adminAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories'])
      queryClient.invalidateQueries(['categories'])
      toast.success('Category updated successfully')
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '' })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update category')
    }
  })

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories'])
      queryClient.invalidateQueries(['categories'])
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete category')
    }
  })

  const handleSubmitCategory = (e) => {
    e.preventDefault()
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required')
      return
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory._id, ...categoryForm })
    } else {
      createCategoryMutation.mutate(categoryForm)
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryForm({ name: category.name, description: category.description || '' })
    setShowAddCategory(true)
  }

  const handleDeleteCategory = (category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      deleteCategoryMutation.mutate(category._id)
    }
  }

  const resetForm = () => {
    setShowAddCategory(false)
    setEditingCategory(null)
    setCategoryForm({ name: '', description: '' })
  }

  const stats = [
    {
      label: 'Total Users',
      value: dashboardData?.stats?.totalUsers || 0,
      icon: Users,
      color: 'text-primary'
    },
    {
      label: 'Total Tickets',
      value: dashboardData?.stats?.totalTickets || 0,
      icon: Ticket,
      color: 'text-secondary'
    },
    {
      label: 'Open Tickets',
      value: dashboardData?.stats?.openTickets || 0,
      icon: Clock,
      color: 'text-warning'
    },
    {
      label: 'Pending Role Requests',
      value: dashboardData?.stats?.pendingRoleRequests || 0,
      icon: UserPlus,
      color: 'text-accent'
    },
    {
      label: 'Total Categories',
      value: dashboardData?.stats?.totalCategories || 0,
      icon: Tag,
      color: 'text-success'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage and moderate the QuickDesk platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-gray-200 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Recent Tickets
            </h3>
            <a href="/tickets" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </a>
          </div>
          
          {dashboardData?.recentActivity?.tickets?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.tickets.map((ticket) => (
                <div key={ticket._id} className="flex items-center gap-4 p-3 bg-base-100 rounded-lg">
                  <div className="w-12 h-12 bg-base-300 rounded-lg flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-base-content/50" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{ticket.subject}</h4>
                    <p className="text-sm text-base-content/70">
                      by {ticket.creator?.firstName} {ticket.creator?.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      ticket.status === 'resolved' ? 'badge-success' :
                      ticket.status === 'in_progress' ? 'badge-info' :
                      ticket.status === 'open' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No recent tickets</p>
            </div>
          )}
        </div>

        {/* Recent Role Requests */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Recent Role Requests
            </h3>
            <a href="/admin/role-requests" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </a>
          </div>
          
          {dashboardData?.recentActivity?.roleRequests?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.roleRequests.map((request) => (
                <div key={request._id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{request.user?.firstName} {request.user?.lastName}</h4>
                    <p className="text-sm text-gray-600">
                      Requesting: {request.requestedRole.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      request.status === 'approved' ? 'badge-success' :
                      request.status === 'pending' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No recent role requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Category Management
          </h3>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {/* Category Form */}
        {showAddCategory && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="text-md font-medium mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h4>
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category description (optional)"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        {categoriesLoading ? (
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map((category) => (
              <div key={category._id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      disabled={deleteCategoryMutation.isPending}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  ID: {category._id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/tickets?status=open" className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Clock className="w-4 h-4 mr-2" />
            Review Open Tickets
          </a>
          <a href="/tickets" className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Ticket className="w-4 h-4 mr-2" />
            Manage All Tickets
          </a>
          {/* can add view users functionality  */}
          <a href="/" className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Users className="w-4 h-4 mr-2" />
            View Users
          </a>
          <a href="/admin/role-requests?status=pending" className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <UserPlus className="w-4 h-4 mr-2" />
            Review Role Requests
          </a>
        </div>
      </div>

      {/* Admin Guidelines */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Admin Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-green-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approve Role Requests When:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-6">
              <li>• User has good track record</li>
              <li>• Reason is legitimate and clear</li>
              <li>• User demonstrates competence</li>
              <li>• Request aligns with platform needs</li>
              <li>• User has been active for reasonable time</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-red-600 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Reject Role Requests When:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-6">
              <li>• User has poor track record</li>
              <li>• Reason is unclear or inappropriate</li>
              <li>• User shows lack of competence</li>
              <li>• Request seems suspicious</li>
              <li>• User has been inactive or problematic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 