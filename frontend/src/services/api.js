import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add timestamp to GET requests to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token failed, logout user
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token, logout user
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me').then(res => res.data.data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
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
  
  // Category management
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
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