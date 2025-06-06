"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

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

type SupabaseTransactionResponse = {
  id: number;
  created_at: string;
  total: number;
  transaction_items: {
    id: number;
    quantity: number;
    price: number;
    product_id: string;
    product: {
      id: string;
      name: string;
    } | null;
  }[];
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [totalCount, setTotalCount] = useState(0);

  const fetchReports = async (start?: string, end?: string, pageNumber = 1) => {
    setLoading(true);

    const from = (pageNumber - 1) * perPage;
    const to = from + perPage - 1;

    let baseQuery = supabase
      .from("transactions")
      .select(
        `
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
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (start) {
      baseQuery = baseQuery.gte("created_at", start);
    }
    if (end) {
      const endDateWithTime = dayjs(end).endOf("day").toISOString();
      baseQuery = baseQuery.lte("created_at", endDateWithTime);
    }

    const { data, error, count } = await baseQuery;

    if (error) {
      console.error("Error fetching reports:", error);
      setTransactions([]);
    } else {
      const formatted = (data as unknown as SupabaseTransactionResponse[]).map(
        (trx) => ({
          id: trx.id,
          created_at: trx.created_at,
          total: trx.total,
          items: trx.transaction_items.map((item) => ({
            id: item.id,
            transaction_id: trx.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product: item.product ?? { id: "", name: "Produk tidak ditemukan" },
          })),
        })
      );

      setTransactions(formatted);
      if (count !== null) setTotalCount(count);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchReports(startDate, endDate, page);
  }, [page]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports(startDate, endDate, 1);
  };

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Laporan Transaksi</h1>

      <form
        onSubmit={handleFilter}
        className="mb-6 flex gap-4 items-end flex-wrap"
      >
        <div>
          <label className="block mb-1 font-semibold" htmlFor="startDate">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
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
            onChange={(e) => setEndDate(e.target.value)}
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
            setStartDate("");
            setEndDate("");
            setPage(1);
            fetchReports("", "", 1);
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
              <strong>Tanggal:</strong>{" "}
              {dayjs(trx.created_at).format("DD MMM YYYY HH:mm")}
            </div>
            <div className="mb-2">
              <strong>Items:</strong>
              <ul className="ml-4 list-disc">
                {trx.items.map((item) => (
                  <li key={item.id}>
                    {item.product?.name || "Produk tidak ditemukan"} –{" "}
                    {item.quantity} × Rp{item.price.toLocaleString()}
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

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-4">
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
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
