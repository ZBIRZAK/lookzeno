import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CustomPrintPage from './pages/CustomPrintPage';
import DashboardPage from './pages/DashboardPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LegalNoticePage from './pages/LegalNoticePage';
import CookiesPage from './pages/CookiesPage';
import WhyLookZenoPage from './pages/WhyLookZenoPage';
import { CartProvider } from './context/CartContext';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/product/shutter-speed" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/custom-print" element={<CustomPrintPage />} />
          <Route path="/pourquoi-lookzeno" element={<WhyLookZenoPage />} />
          <Route path="/politique-confidentialite" element={<PrivacyPage />} />
          <Route path="/conditions-generales" element={<TermsPage />} />
          <Route path="/mentions-legales" element={<LegalNoticePage />} />
          <Route path="/politique-cookies" element={<CookiesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
