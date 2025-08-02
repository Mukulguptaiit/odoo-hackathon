import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../services/api'
import { 
  Users, 
  ShoppingBag, 
  RefreshCw, 
  Clock,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react'

const AdminDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminAPI.getDashboard().then(res => res.data.data),
  })

  const stats = [
    {
      label: 'Total Users',
      value: dashboardData?.stats?.totalUsers || 0,
      icon: Users,
      color: 'text-primary'
    },
    {
      label: 'Total Items',
      value: dashboardData?.stats?.totalItems || 0,
      icon: ShoppingBag,
      color: 'text-secondary'
    },
    {
      label: 'Pending Items',
      value: dashboardData?.stats?.pendingItems || 0,
      icon: Clock,
      color: 'text-warning'
    },
    {
      label: 'Total Swaps',
      value: dashboardData?.stats?.totalSwaps || 0,
      icon: RefreshCw,
      color: 'text-accent'
    },
    {
      label: 'Completed Swaps',
      value: dashboardData?.stats?.completedSwaps || 0,
      icon: TrendingUp,
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
        <h1 className="text-3xl font-bold text-base-content">Admin Dashboard</h1>
        <p className="text-base-content/70 mt-2">
          Manage and moderate the ReWear platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-base-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/70">{stat.label}</p>
                <p className="text-2xl font-bold text-base-content">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-base-300 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Items */}
        <div className="bg-base-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Recent Items
            </h3>
            <a href="/admin/items" className="text-sm text-primary hover:text-primary-focus">
              View all
            </a>
          </div>
          
          {dashboardData?.recentActivity?.items?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.items.map((item) => (
                <div key={item._id} className="flex items-center gap-4 p-3 bg-base-100 rounded-lg">
                  <div className="w-12 h-12 bg-base-300 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-base-content/50" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-base-content/70">
                      by {item.uploader?.firstName} {item.uploader?.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      item.status === 'available' ? 'badge-success' :
                      item.status === 'pending' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">No recent items</p>
            </div>
          )}
        </div>

        {/* Recent Swaps */}
        <div className="bg-base-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Recent Swaps
            </h3>
            <a href="/admin/swaps" className="text-sm text-primary hover:text-primary-focus">
              View all
            </a>
          </div>
          
          {dashboardData?.recentActivity?.swaps?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.swaps.map((swap) => (
                <div key={swap._id} className="flex items-center gap-4 p-3 bg-base-100 rounded-lg">
                  <div className="w-12 h-12 bg-base-300 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-base-content/50" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{swap.itemRequested?.title}</h4>
                    <p className="text-sm text-base-content/70">
                      by {swap.requester?.firstName} {swap.requester?.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      swap.status === 'completed' ? 'badge-success' :
                      swap.status === 'accepted' ? 'badge-info' :
                      swap.status === 'pending' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {swap.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">No recent swaps</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-base-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/items?status=pending" className="btn btn-outline btn-block">
            <Clock className="w-4 h-4 mr-2" />
            Review Pending Items
          </a>
          <a href="/admin/items" className="btn btn-outline btn-block">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Manage All Items
          </a>
          <a href="/admin/users" className="btn btn-outline btn-block">
            <Users className="w-4 h-4 mr-2" />
            View Users
          </a>
          <a href="/admin/swaps" className="btn btn-outline btn-block">
            <RefreshCw className="w-4 h-4 mr-2" />
            Monitor Swaps
          </a>
        </div>
      </div>

      {/* Moderation Guidelines */}
      <div className="bg-base-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Moderation Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approve Items That:
            </h4>
            <ul className="text-sm text-base-content/70 space-y-1 ml-6">
              <li>• Are in good condition</li>
              <li>• Have clear, high-quality images</li>
              <li>• Include accurate descriptions</li>
              <li>• Follow community guidelines</li>
              <li>• Are appropriate for all ages</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-error flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Reject Items That:
            </h4>
            <ul className="text-sm text-base-content/70 space-y-1 ml-6">
              <li>• Are in poor condition</li>
              <li>• Have inappropriate content</li>
              <li>• Violate community guidelines</li>
              <li>• Are counterfeit or fake</li>
              <li>• Have unclear or misleading descriptions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 