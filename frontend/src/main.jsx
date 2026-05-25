import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { store } from './store/index.js'
import './index.css'
// create a router with future flags to opt into upcoming v7 behaviors
const router = createBrowserRouter([
  { path: '/*', element: <App /> }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '0.5rem',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#f1f5f9' },
            style: { borderLeft: '4px solid #22c55e' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#f1f5f9' },
            style: { borderLeft: '4px solid #f43f5e' },
          },
        }}
      />
    </Provider>
  </React.StrictMode>
)
