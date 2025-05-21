'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Product = {
  id: number;
  name: string;
  price: number;
};

type CartItem = Product & {
  quantity: number;
};

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select();
      if (error) {
        console.error(error);
      } else {
        setProducts(data);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const incrementQty = (productId: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQty = (productId: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        )
        // Jika ingin, bisa juga hapus jika quantity 0 (tapi minimal 1 diminta)
        // .filter(item => item.quantity > 0)
    );
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang kosong');
      return;
    }

    // Step 1: Insert transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert([{ total: getTotal() }])
      .select()
      .single();

    if (transactionError) {
      console.error('Insert transaksi gagal:', transactionError);
      return alert('Checkout gagal: ' + transactionError.message);
    }

    // Step 2: Insert transaction_items
    const itemsToInsert = cart.map(item => ({
      transaction_id: transactionData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Insert detail gagal:', itemsError);
      return alert('Checkout gagal: ' + itemsError.message);
    }

    alert('Checkout berhasil!');
    setCart([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Product List */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Produk</h2>
          <ul>
            {products.map(product => (
              <li
                key={product.id}
                className="flex justify-between items-center py-2 border-b"
              >
                <div>
                  <p>{product.name}</p>
                  <p className="text-sm text-gray-500">
                    Rp{product.price.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Tambah
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Cart */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Keranjang</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">Belum ada item</p>
          ) : (
            <ul>
              {cart.map(item => (
                <li
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <div>
                    <p className="mb-1">
                      {item.name} x {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      Rp{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => decrementQty(item.id)}
                      className="bg-gray-300 px-2 rounded hover:bg-gray-400"
                      aria-label={`Kurangi jumlah ${item.name}`}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => incrementQty(item.id)}
                      className="bg-gray-300 px-2 rounded hover:bg-gray-400"
                      aria-label={`Tambah jumlah ${item.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:underline ml-4"
                      aria-label={`Hapus ${item.name} dari keranjang`}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Total & Checkout */}
          <div className="mt-4">
            <p className="text-lg font-semibold">
              Total: Rp{getTotal().toLocaleString()}
            </p>
            <button
              onClick={handleCheckout}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              disabled={cart.length === 0}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
