import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me').then(res => res.data.data),
}

// Items API
export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (formData) => api.post('/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  getUserItems: () => api.get('/items/user/me'),
}

// Swaps API
export const swapsAPI = {
  create: (swapData) => api.post('/swaps', swapData),
  getAll: (params) => api.get('/swaps', { params }),
  getById: (id) => api.get(`/swaps/${id}`),
  update: (id, data) => api.put(`/swaps/${id}`, data),
}

// Admin API
export const adminAPI = {
  getTickets: (params) => api.get('/admin/tickets', { params }),
  deleteTicket: (id) => api.delete(`/admin/tickets/${id}`),
  getRoleRequests: (params) => api.get('/admin/role-requests', { params }),
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
}

// Role Requests API
export const roleRequestsAPI = {
  getAll: (params) => api.get('/role-requests', { params }),
  getMyRequests: () => api.get('/role-requests/my-requests'),
  create: (data) => api.post('/role-requests', data),
  review: (id, data) => api.put(`/role-requests/${id}/review`, data),
  delete: (id) => api.delete(`/role-requests/${id}`),
}

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getUserInterests: () => api.get('/categories/user-interests'),
  updateUserInterests: (data) => api.put('/categories/user-interests', data),
}

// Comments API
export const commentsAPI = {
  getByTicket: (ticketId) => api.get(`/comments/ticket/${ticketId}`),
  create: (data) => api.post('/comments', data),
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
  vote: (id, voteType) => api.post(`/comments/${id}/vote`, { voteType }),
}

export default api 