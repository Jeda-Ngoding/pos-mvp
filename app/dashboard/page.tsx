"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

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
  // Summary state
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalOmzet, setTotalOmzet] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  // Transaction list state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & pagination state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [totalCount, setTotalCount] = useState(0);

  // Fetch dashboard summary (today)
  const fetchSummary = async () => {
    const startOfDay = dayjs().startOf("day").toISOString();
    const { data: txToday } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", startOfDay);

    setTotalTransactions(txToday?.length || 0);
    setTotalOmzet(txToday?.reduce((acc, t) => acc + Number(t.total), 0) || 0);

    const { data: itemsToday } = await supabase
      .from("transaction_items")
      .select(`product_id, quantity, product:products(name)`)
      .in("transaction_id", txToday ? txToday.map((t) => t.id) : []);

    const map: Record<string, { name: string; total_quantity: number }> = {};

    itemsToday?.forEach((item) => {
      const key = item.product_id;
      let productName = "";

      if (Array.isArray(item.product) && item.product.length > 0) {
        productName = item.product[0].name;
      } else if (item.product && typeof item.product === "object") {
        productName = item.product.name;
      }

      if (!map[key]) map[key] = { name: productName, total_quantity: 0 };
      map[key].total_quantity += item.quantity;
    });

    setTopProducts(
      Object.entries(map)
        .map(([product_id, { name, total_quantity }]) => ({
          product_id,
          name,
          total_quantity,
        }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 3)
    );
  };

  // Fetch transactions with filter & pagination
  const fetchTransactions = async (pageNum = 1) => {
    setLoading(true);
    const from = (pageNum - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (startDate)
      query = query.gte(
        "created_at",
        dayjs(startDate).startOf("day").toISOString()
      );
    if (endDate)
      query = query.lte(
        "created_at",
        dayjs(endDate).endOf("day").toISOString()
      );

    const { data, error, count } = await query;
    if (error) console.error(error);
    else {
      setTransactions(data || []);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions(1);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
    fetchTransactions(1);
  };

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Summary Boxes */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">
            Total Transaksi Hari Ini
          </h2>
          <p className="text-2xl">{totalTransactions}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Total Omzet Hari Ini</h2>
          <p className="text-2xl">Rp{totalOmzet.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">
            Produk Terlaris Hari Ini
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500">Belum ada penjualan</p>
          ) : (
            <ul>
              {topProducts.map((p) => (
                <li key={p.product_id}>
                  {p.name} - {p.total_quantity} pcs
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Filter Transactions */}
      <form
        onSubmit={handleFilter}
        className="mb-4 flex flex-wrap gap-4 items-end"
      >
        <div>
          <label htmlFor="start" className="block mb-1 font-semibold">
            Start Date
          </label>
          <input
            id="start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="end" className="block mb-1 font-semibold">
            End Date
          </label>
          <input
            id="end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Reset
        </button>
      </form>

      {/* Transactions Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {transactions.length === 0 ? (
            <p className="text-gray-500">Tidak ada transaksi.</p>
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
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="border px-4 py-2">{t.id}</td>
                    <td className="border px-4 py-2">
                      {dayjs(t.created_at).format("DD MMM YYYY HH:mm")}
                    </td>
                    <td className="border px-4 py-2 text-right">
                      Rp{Number(t.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
