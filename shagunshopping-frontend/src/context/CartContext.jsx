import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FREE_SHIPPING_ABOVE_PREPAID, SHIPPING_FEE } from '../lib/config';

const CartContext = createContext(null);
const STORAGE_KEY = 'shagun_cart_v1';
const MAX_QTY = 10;

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const id = product._id || product.id;
      const existing = prev.find((i) => i.id === id);
      const cap = Math.min(MAX_QTY, product.stock ?? MAX_QTY);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, qty: Math.min(cap, i.qty + qty) } : i
        );
      }
      return [
        ...prev,
        {
          id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          mrp: product.mrp,
          image: product.images?.[0] || '',
          stock: product.stock,
          qty: Math.min(cap, qty),
        },
      ];
    });
  };

  const setQty = (id, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, i.stock ?? MAX_QTY, qty)) }
          : i
      )
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const mrpTotal = items.reduce((s, i) => s + i.mrp * i.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE_PREPAID ? 0 : SHIPPING_FEE;
    return {
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      savings: mrpTotal - subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, setQty, removeItem, clearCart, ...totals }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
