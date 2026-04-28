import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocket } from './lib/socket';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ComparePage from './pages/ComparePage';
import SearchResultsPage from './pages/SearchResultsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import HelpCentrePage from './pages/HelpCentrePage';
import HelpArticlePage from './pages/HelpArticlePage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsPage from './pages/legal/TermsPage';
import RefundPolicyPage from './pages/legal/RefundPolicyPage';
import NotFoundPage from './pages/NotFoundPage';

// Customer pages
import CartPage from './pages/customer/CartPage';
import WishlistPage from './pages/customer/WishlistPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import ProfilePage from './pages/customer/ProfilePage';
import ReturnRequestPage from './pages/customer/ReturnRequestPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminUsers from './pages/admin/AdminUsers';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminBanners from './pages/admin/AdminBanners';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReturns from './pages/admin/AdminReturns';
import AdminHelp from './pages/admin/AdminHelp';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';

const ProtectedRoute = ({ children, roles }) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  useSocket();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="help" element={<HelpCentrePage />} />
        <Route path="help/:id" element={<HelpArticlePage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="refund-policy" element={<RefundPolicyPage />} />

        {/* Customer */}
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<ProtectedRoute roles={['CUSTOMER', 'ADMIN']}><WishlistPage /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute roles={['CUSTOMER', 'ADMIN']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute roles={['CUSTOMER', 'ADMIN']}><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute roles={['CUSTOMER', 'ADMIN']}><OrderDetailPage /></ProtectedRoute>} />
        <Route path="orders/:id/return" element={<ProtectedRoute roles={['CUSTOMER', 'ADMIN']}><ReturnRequestPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'SALESPERSON', 'DELIVERY_AGENT']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<ProtectedRoute roles={['ADMIN']}><AdminProducts /></ProtectedRoute>} />
        <Route path="products/new" element={<ProtectedRoute roles={['ADMIN']}><AdminProductForm /></ProtectedRoute>} />
        <Route path="products/:id/edit" element={<ProtectedRoute roles={['ADMIN']}><AdminProductForm /></ProtectedRoute>} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="inventory" element={<ProtectedRoute roles={['ADMIN']}><AdminInventory /></ProtectedRoute>} />
        <Route path="coupons" element={<ProtectedRoute roles={['ADMIN']}><AdminCoupons /></ProtectedRoute>} />
        <Route path="banners" element={<ProtectedRoute roles={['ADMIN']}><AdminBanners /></ProtectedRoute>} />
        <Route path="reviews" element={<ProtectedRoute roles={['ADMIN']}><AdminReviews /></ProtectedRoute>} />
        <Route path="returns" element={<ProtectedRoute roles={['ADMIN']}><AdminReturns /></ProtectedRoute>} />
        <Route path="help" element={<ProtectedRoute roles={['ADMIN']}><AdminHelp /></ProtectedRoute>} />
        <Route path="audit-logs" element={<ProtectedRoute roles={['ADMIN']}><AdminAuditLogs /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute roles={['ADMIN', 'SALESPERSON']}><AnalyticsDashboard /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
