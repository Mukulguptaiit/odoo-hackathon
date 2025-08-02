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
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      cacheTime: 30 * 60 * 1000, // 30 minutes - cache data for longer
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnMount: false, // Don't refetch when component mounts if data exists
      refetchOnReconnect: true, // Only refetch on reconnect
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