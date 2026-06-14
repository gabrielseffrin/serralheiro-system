import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import AppLayout from '@/layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '@/modules/auth/pages/LoginPage';
import ForgotPasswordPage from '@/modules/auth/pages/ForgotPasswordPage';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';
import CustomersPage from '@/modules/customers/pages/CustomersPage';
import ProductsPage from '@/modules/products/pages/ProductsPage';
import CatalogsPage from '@/modules/catalogs/pages/CatalogsPage';
import CompanyPage from '@/modules/company/pages/CompanyPage';
import BudgetsPage from '@/modules/budgets/pages/BudgetsPage';
import BudgetFormPage from '@/modules/budgets/pages/BudgetFormPage';
import PublicBudgetPage from '@/modules/budgets/pages/PublicBudgetPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/p/:token',
    element: <PublicBudgetPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/customers', element: <CustomersPage /> },
          { path: '/products', element: <ProductsPage /> },
          { path: '/catalogs', element: <CatalogsPage /> },
          { path: '/budgets', element: <BudgetsPage /> },
          { path: '/budgets/new', element: <BudgetFormPage /> },
          { path: '/budgets/:id/edit', element: <BudgetFormPage /> },
          { path: '/settings', element: <CompanyPage /> },
        ],
      },
    ],
  },
]);
