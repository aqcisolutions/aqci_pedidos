import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Shop from './pages/Shop';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Customers from './pages/admin/Customers';
import Settings from './pages/admin/Settings';
import Companies from './pages/gestor/Companies';
import Login from './pages/auth/Login';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRole="admin_loja">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="customers" element={<Customers />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Gestor Routes */}
          <Route 
            path="/gestor" 
            element={
              <ProtectedRoute allowedRole="gestor">
                <Companies />
              </ProtectedRoute>
            } 
          />

          {/* Public Store Route */}
          <Route path="/:slug" element={<Shop />} />
          
          {/* Fallback */}
          <Route path="/" element={<Navigate to="/mimo" replace />} />
          <Route path="*" element={<Navigate to="/mimo" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
