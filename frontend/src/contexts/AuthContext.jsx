import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authAPI.getCurrentUser()
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { token, refreshToken, ...userData } = response.data.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(userData)
      
      toast.success('Login successful!')
      navigate('/dashboard')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { token, refreshToken, ...user } = response.data.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)
      
      toast.success('Registration successful!')
      navigate('/dashboard')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/')
  }

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 