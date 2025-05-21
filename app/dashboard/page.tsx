'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Transaction = {
  id: number;
  created_at: string;
  total: number;
};

type TopProduct = {
  product_id: string;
  name: string;
  total_quantity: number;
};

export default function DashboardPage() {
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalOmzet, setTotalOmzet] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const isoStartOfDay = startOfDay.toISOString();

      // 1. Total transaksi hari ini
      const { data: transactionsToday, error: error1 } = await supabase
        .from('transactions')
        .select('id,total,created_at')
        .gte('created_at', isoStartOfDay);

      if (error1) {
        console.error('Error fetching transactions:', error1);
        setLoading(false);
        return;
      }

      setTotalTransactions(transactionsToday.length);
      setTotalOmzet(transactionsToday.reduce((acc, t) => acc + Number(t.total), 0));

      // 2. Produk terlaris hari ini (top 3)
      // Join transaction_items with products, filter by transactions created today
      const { data: topProductsData, error: error2 } = await supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          product:products(name)
        `)
        .in(
          'transaction_id',
          transactionsToday.map(t => t.id)
        );

      if (error2) {
        console.error('Error fetching top products:', error2);
        setLoading(false);
        return;
      }

      // Aggregate quantity per product
      const productMap: Record<string, { name: string; total_quantity: number }> = {};
      topProductsData.forEach(item => {
        if (!productMap[item.product_id]) {
          productMap[item.product_id] = { name: item.product.name, total_quantity: 0 };
        }
        productMap[item.product_id].total_quantity += item.quantity;
      });

      const sortedProducts = Object.entries(productMap)
        .map(([product_id, { name, total_quantity }]) => ({
          product_id,
          name,
          total_quantity,
        }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 3);

      setTopProducts(sortedProducts);

      // 3. 5 transaksi terakhir
      const { data: recentTrans, error: error3 } = await supabase
        .from('transactions')
        .select('id,total,created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error3) {
        console.error('Error fetching recent transactions:', error3);
        setLoading(false);
        return;
      }

      setRecentTransactions(recentTrans);
      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-100 p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Total Transaksi Hari Ini</h2>
              <p className="text-2xl">{totalTransactions}</p>
            </div>
            <div className="bg-green-100 p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Total Omzet Hari Ini</h2>
              <p className="text-2xl">Rp{totalOmzet.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Produk Terlaris Hari Ini</h2>
              {topProducts.length === 0 ? (
                <p className="text-gray-500">Belum ada penjualan</p>
              ) : (
                <ul>
                  {topProducts.map(p => (
                    <li key={p.product_id}>
                      {p.name} - {p.total_quantity} pcs
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">5 Transaksi Terakhir</h2>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500">Belum ada transaksi</p>
            ) : (
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-4 py-2 text-left">ID</th>
                    <th className="border px-4 py-2 text-left">Tanggal</th>
                    <th className="border px-4 py-2 text-right">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(t => (
                    <tr key={t.id}>
                      <td className="border px-4 py-2">{t.id}</td>
                      <td className="border px-4 py-2">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2 text-right">
                        Rp{Number(t.total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
