"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchBills() {
    fetch("/api/bills?paid=false")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setBills(data.bills);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }

  useEffect(() => {
    fetchBills();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this bill? Stock will be restored.")) return;
    const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchBills();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Unpaid Bills
          </h1>
          <Link
            href="/billing"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New Bill
          </Link>
        </div>

        {bills.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            No bills yet
          </div>
        )}

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {bills.map((b) => (
            <div
              key={b._id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-50">
                  #{b.billNumber}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  Rs. {b.totalAmount.toFixed(2)}
                </span>
              </div>
              {(b.discountPercent ?? 0) > 0 && (
                <div className="mb-2 text-xs text-red-600 dark:text-red-400">
                  Discount: {b.discountPercent}% (−Rs. {(b.discountAmount ?? 0).toFixed(2)})
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                <span>{b.customerName || "No customer"}</span>
                <span>
                  {new Date(b.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="flex gap-3 text-sm">
                <Link
                  href={`/bills/${b._id}`}
                  className="text-blue-600 dark:text-blue-400"
                >
                  View
                </Link>
                <Link
                  href={`/bills/${b._id}/edit`}
                  className="text-zinc-600 dark:text-zinc-400"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(b._id)}
                  className="text-red-600 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        {bills.length > 0 && (
          <div className="hidden md:block rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Bill #</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Customer</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Items</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Disc %</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b._id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-50">#{b.billNumber}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{b.customerName || "—"}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400">{b.items.length}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                      {(b.discountPercent ?? 0) > 0 ? `${b.discountPercent}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">Rs. {b.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link href={`/bills/${b._id}`} className="text-blue-600 hover:underline dark:text-blue-400">View</Link>
                      <Link href={`/bills/${b._id}/edit`} className="text-zinc-600 hover:underline dark:text-zinc-400">Edit</Link>
                      <button onClick={() => handleDelete(b._id)} className="text-red-600 hover:underline dark:text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
