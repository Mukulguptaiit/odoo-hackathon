import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../services/api'
import { 
  Users, 
  Ticket, 
  Clock, 
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  UserPlus,
  Tag
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
        <h1 className="text-3xl font-bold text-base-content">Admin Dashboard</h1>
        <p className="text-base-content/70 mt-2">
          Manage and moderate the QuickDesk platform
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
        {/* Recent Tickets */}
        <div className="bg-base-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Recent Tickets
            </h3>
            <a href="/admin/tickets" className="text-sm text-primary hover:text-primary-focus">
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
              <Ticket className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">No recent tickets</p>
            </div>
          )}
        </div>

        {/* Recent Role Requests */}
        <div className="bg-base-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Recent Role Requests
            </h3>
            <a href="/admin/role-requests" className="text-sm text-primary hover:text-primary-focus">
              View all
            </a>
          </div>
          
          {dashboardData?.recentActivity?.roleRequests?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.roleRequests.map((request) => (
                <div key={request._id} className="flex items-center gap-4 p-3 bg-base-100 rounded-lg">
                  <div className="w-12 h-12 bg-base-300 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-base-content/50" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{request.user?.firstName} {request.user?.lastName}</h4>
                    <p className="text-sm text-base-content/70">
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
              <UserPlus className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">No recent role requests</p>
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
          <a href="/admin/tickets?status=open" className="btn btn-outline btn-block">
            <Clock className="w-4 h-4 mr-2" />
            Review Open Tickets
          </a>
          <a href="/admin/tickets" className="btn btn-outline btn-block">
            <Ticket className="w-4 h-4 mr-2" />
            Manage All Tickets
          </a>
          <a href="/admin/users" className="btn btn-outline btn-block">
            <Users className="w-4 h-4 mr-2" />
            View Users
          </a>
          <a href="/admin/role-requests?status=pending" className="btn btn-outline btn-block">
            <UserPlus className="w-4 h-4 mr-2" />
            Review Role Requests
          </a>
        </div>
      </div>

      {/* Admin Guidelines */}
      <div className="bg-base-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Admin Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approve Role Requests When:
            </h4>
            <ul className="text-sm text-base-content/70 space-y-1 ml-6">
              <li>• User has good track record</li>
              <li>• Reason is legitimate and clear</li>
              <li>• User demonstrates competence</li>
              <li>• Request aligns with platform needs</li>
              <li>• User has been active for reasonable time</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-error flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Reject Role Requests When:
            </h4>
            <ul className="text-sm text-base-content/70 space-y-1 ml-6">
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