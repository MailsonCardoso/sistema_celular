import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ServiceOrdersPage from './pages/ServiceOrdersPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import ProductsPage from './pages/ProductsPage'
import FinancialPage from './pages/FinancialPage'
import StoresPage from './pages/StoresPage'
import UsersPage from './pages/UsersPage'
import NotFoundPage from './pages/NotFoundPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="ordens" element={<ServiceOrdersPage />} />
            <Route path="equipe" element={<PrivateRoute roles={['admin', 'super_admin']}><UsersPage /></PrivateRoute>} />
            <Route
              path="admin/lojas"
              element={
                <PrivateRoute roles={['super_admin']}>
                  <StoresPage />
                </PrivateRoute>
              }
            />

            <Route
              path="clientes"
              element={
                <PrivateRoute roles={['admin', 'atendente', 'super_admin']}>
                  <ClientsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="clientes/:id"
              element={
                <PrivateRoute roles={['admin', 'atendente', 'super_admin']}>
                  <ClientDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="estoque"
              element={
                <PrivateRoute roles={['admin', 'atendente', 'super_admin']}>
                  <ProductsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="financeiro"
              element={
                <PrivateRoute roles={['admin', 'super_admin']}>
                  <FinancialPage />
                </PrivateRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
