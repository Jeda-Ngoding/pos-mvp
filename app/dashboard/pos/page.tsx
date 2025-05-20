'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Product = {
  id: number;
  name: string;
  price: number;
};

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        alert('Error fetching products: ' + error.message);
      } else {
        setProducts(data ?? []);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) return <p>Loading products...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">POS</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} - Rp {product.price.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
