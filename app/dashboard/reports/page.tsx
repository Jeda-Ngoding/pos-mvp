'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

type Product = {
  id: string;
  name: string;
};

type TransactionItem = {
  id: number;
  transaction_id: number;
  product_id: string;
  quantity: number;
  price: number;
  product: Product;
};

type Transaction = {
  id: number;
  created_at: string;
  total: number;
  items: TransactionItem[];
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchReports = async (start?: string, end?: string) => {
    setLoading(true);

    let query = supabase
      .from('transactions')
      .select(`
        id,
        created_at,
        total,
        transaction_items (
          id,
          quantity,
          price,
          product_id,
          product:products ( id, name )
        )
      `)
      .order('created_at', { ascending: false });

    if (start) {
      query = query.gte('created_at', start);
    }
    if (end) {
      // Untuk menyertakan hari endDate secara lengkap, kita tambahkan waktu 23:59:59
      const endDateWithTime = dayjs(end).endOf('day').toISOString();
      query = query.lte('created_at', endDateWithTime);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      setTransactions([]);
    } else {
      const formatted = data.map((trx: any) => ({
        ...trx,
        items: trx.transaction_items.map((item: any) => ({
          ...item,
          product: item.product,
        })),
      }));

      setTransactions(formatted);
    }

    setLoading(false);
  };

  // Fetch semua data awalnya
  useEffect(() => {
    fetchReports();
  }, []);

  // Handle filter submit
  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(startDate, endDate);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Laporan Transaksi</h1>

      <form onSubmit={handleFilter} className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block mb-1 font-semibold" htmlFor="startDate">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold" htmlFor="endDate">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        >
          Filter
        </button>

        <button
          type="button"
          onClick={() => {
            setStartDate('');
            setEndDate('');
            fetchReports();
          }}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
        >
          Reset
        </button>
      </form>

      {loading && <p>Loading...</p>}

      {transactions.length === 0 && !loading && <p>Tidak ada transaksi.</p>}

      <div className="space-y-6">
        {transactions.map((trx) => (
          <div key={trx.id} className="border p-4 rounded shadow">
            <div className="mb-2 text-gray-700">
              <strong>ID:</strong> {trx.id}
            </div>
            <div className="mb-2 text-gray-700">
              <strong>Tanggal:</strong> {dayjs(trx.created_at).format('DD MMM YYYY HH:mm')}
            </div>
            <div className="mb-2">
              <strong>Items:</strong>
              <ul className="ml-4 list-disc">
                {trx.items.map((item) => (
                  <li key={item.id}>
                    {item.product?.name || 'Produk tidak ditemukan'} – {item.quantity} × Rp{item.price.toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-2 font-semibold">
              Total: Rp{trx.total.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
