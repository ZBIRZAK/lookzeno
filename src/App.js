import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CustomPrintPage from './pages/CustomPrintPage';
import DashboardPage from './pages/DashboardPage';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/product/shutter-speed" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/custom-print" element={<CustomPrintPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
