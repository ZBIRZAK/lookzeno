import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'lookzeno_cart_v1';

const CartContext = createContext(null);

function readInitialCart() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readInitialCart);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (nextItem) => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.id === nextItem.id && item.size === nextItem.size
      );

      if (existingIndex === -1) {
        return [...current, nextItem];
      }

      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: Math.min(20, updated[existingIndex].qty + nextItem.qty)
      };
      return updated;
    });
  };

  const removeItem = (id, size) => {
    setItems((current) => current.filter((item) => !(item.id === id && item.size === size)));
  };

  const updateQty = (id, size, qty) => {
    const safeQty = Math.max(1, Math.min(20, qty));
    setItems((current) =>
      current.map((item) => (item.id === id && item.size === size ? { ...item, qty: safeQty } : item))
    );
  };

  const clearCart = () => setItems([]);

  const value = useMemo(() => {
    const totalCount = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    return {
      items,
      totalCount,
      subtotal,
      addItem,
      removeItem,
      updateQty,
      clearCart
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
