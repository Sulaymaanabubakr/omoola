import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { checkAdminAccess, onAuthChange } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

// Public pages
import PublicLayout from '@/layouts/PublicLayout';
import HomePage from '@/pages/shop/HomePage';
import ProductsPage from '@/pages/shop/ProductsPage';
import ProductDetailPage from '@/pages/shop/ProductDetailPage';
import CartPage from '@/pages/shop/CartPage';
import CheckoutPage from '@/pages/shop/CheckoutPage';
import OrderSuccessPage from '@/pages/shop/OrderSuccessPage';
import ContactPage from '@/pages/shop/ContactPage';

// Admin pages
import AdminLayout from '@/layouts/AdminLayout';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminMessagesPage from '@/pages/admin/AdminMessagesPage';

// Guard
import ProtectedRoute from '@/components/admin/ProtectedRoute';

export default function App() {
  const { setUser, setLoading, setIsAdmin } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const isAdmin = await checkAdminAccess(user.uid);
      setUser(isAdmin ? user : null);
      setIsAdmin(isAdmin);
      setLoading(false);
    });
    return () => unsub();
  }, [setIsAdmin, setLoading, setUser]);

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
