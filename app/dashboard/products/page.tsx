'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabaseBrowser.from('products').select('*').order('created_at', { ascending: false });
    if (!error) setProducts(data);
    else alert(error.message);
  };

  const uploadImage = async (file: File, productId: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${productId}.${fileExt}`;

    const { error: uploadError } = await supabaseBrowser.storage
      .from('product-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseBrowser.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const addProduct = async () => {
    if (!name || !price) return alert('Name and price are required');
    setLoading(true);
    const { data, error } = await supabaseBrowser.from('products').insert([{ name, price: parseFloat(price) }]).select().single();
    if (error) {
      setLoading(false);
      return alert(error.message);
    }

    let imageUrl = null;
    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile, data.id);
        await supabaseBrowser.from('products').update({ image_url: imageUrl }).eq('id', data.id);
      } catch (err: any) {
        alert('Image upload failed: ' + err.message);
      }
    }

    setName('');
    setPrice('');
    setImageFile(null);
    setLoading(false);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabaseBrowser.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(String(product.price));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setImageFile(null);
  };

  const saveEdit = async () => {
    if (!editingId || !name || !price) return;

    let imageUrl = undefined;
    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile, editingId);
      } catch (err: any) {
        return alert('Image upload failed: ' + err.message);
      }
    }

    const updateData: any = { name, price: parseFloat(price) };
    if (imageUrl) updateData.image_url = imageUrl;

    await supabaseBrowser.from('products').update(updateData).eq('id', editingId);
    cancelEdit();
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Product Management</h1>

      <div className="mb-6 flex flex-col md:flex-row gap-2 items-start md:items-center">
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border p-2"
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="border p-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] || null)}
          className="border p-2"
        />
        {editingId ? (
          <>
            <button onClick={saveEdit} className="bg-yellow-500 text-white px-4 py-2 rounded">
              Save
            </button>
            <button onClick={cancelEdit} className="text-gray-600 hover:underline">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={addProduct} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        )}
      </div>

      <ul className="space-y-3">
        {products.map(product => (
          <li key={product.id} className="border p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
              )}
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-600">Rp {product.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(product)} className="text-blue-600 hover:underline">
                Edit
              </button>
              <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:underline">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
