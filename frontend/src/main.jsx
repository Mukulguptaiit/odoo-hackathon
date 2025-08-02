import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// Set data-theme on body
if (typeof document !== 'undefined') {
  document.body.setAttribute('data-theme', 'retro');
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data is immediately stale
      cacheTime: 30 * 1000, // Cache for only 30 seconds
      retry: 1,
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnReconnect: true, // Refetch on reconnect
    },
    mutations: {
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
) 