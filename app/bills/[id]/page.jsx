"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatBs } from "@/lib/nepaliDate";

export default function BillDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bill, setBill] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUser(data.user))
      .catch(() => {});
    fetch(`/api/bills/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setBill(data.bill);
        setLoading(false);
      })
      .catch(() => router.push("/bills"));
  }, [id]);

  const isAdmin = user?.role === "admin";
  const canEdit = !bill?.paid || isAdmin;

  async function handleMarkPaid() {
    const res = await fetch(`/api/bills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setBill(data.bill);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to mark as paid");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this bill? Stock will be restored.")) return;
    const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/bills");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete bill");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!bill) return null;

  function BillCopy({ label }) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-4 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 print:border-none print:p-2 print:shadow-none print:break-inside-avoid">
        {label && (
          <div className="hidden print:block text-right text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">
            {label}
          </div>
        )}
        {/* Header */}
        <div className="relative border-b border-zinc-200 pb-4 mb-4 dark:border-zinc-700 print:border-black print:pb-2 print:mb-2">
          <img
            src="/logo.jpg"
            alt="Butwal Neo Clinic"
            className="absolute left-0 top-0 h-24 w-auto object-contain print:h-20"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 print:text-black print:text-xl">
              Butwal Neo Clinic
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 print:text-black">
              Dharmapath-8, Sukkhanagar, Butwal
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
              butwalneoclinic@gmail.com
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
              PAN: 133660229
            </p>
          </div>
        </div>

        {/* Bill info */}
        <div className="flex justify-between text-sm mb-6 print:mb-3">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 print:text-gray-500">
              Bill No:{" "}
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-50 print:text-black">
                #{bill.billNumber}
              </span>
            </p>
            {bill.customerName && (
              <p className="text-zinc-500 dark:text-zinc-400 print:text-gray-500">
                Customer:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-50 print:text-black">
                  {bill.customerName}
                </span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-zinc-500 dark:text-zinc-400 print:text-gray-500">
              Date:{" "}
              <span className="text-zinc-900 dark:text-zinc-50 print:text-black">
                {formatBs(new Date(bill.createdAt))}
              </span>
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 print:text-gray-500">
              Time:{" "}
              <span className="text-zinc-900 dark:text-zinc-50 print:text-black">
                {new Date(bill.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-4 print:mb-2">
          <thead>
            <tr className="border-b-2 border-zinc-300 dark:border-zinc-600 print:border-black">
              <th className="py-2 text-left font-semibold text-zinc-700 dark:text-zinc-300 print:text-black print:py-1">
                #
              </th>
              <th className="py-2 text-left font-semibold text-zinc-700 dark:text-zinc-300 print:text-black print:py-1">
                Item
              </th>
              <th className="py-2 text-right font-semibold text-zinc-700 dark:text-zinc-300 print:text-black print:py-1">
                Qty
              </th>
              <th className="py-2 text-right font-semibold text-zinc-700 dark:text-zinc-300 print:text-black print:py-1">
                Price
              </th>
              <th className="py-2 text-right font-semibold text-zinc-700 dark:text-zinc-300 print:text-black print:py-1">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, i) => (
              <tr
                key={i}
                className="border-b border-zinc-100 dark:border-zinc-800 print:border-gray-300"
              >
                <td className="py-2 text-zinc-500 dark:text-zinc-400 print:text-gray-600 print:py-1">
                  {i + 1}
                </td>
                <td className="py-2 text-zinc-900 dark:text-zinc-50 print:text-black print:py-1">
                  {item.productName}
                </td>
                <td className="py-2 text-right text-zinc-700 dark:text-zinc-300 print:text-black print:py-1">
                  {item.quantity}
                </td>
                <td className="py-2 text-right text-zinc-700 dark:text-zinc-300 print:text-black print:py-1">
                  Rs. {item.productPrice.toFixed(2)}
                </td>
                <td className="py-2 text-right font-medium text-zinc-900 dark:text-zinc-50 print:text-black print:py-1">
                  Rs. {item.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end border-t-2 border-zinc-300 pt-3 dark:border-zinc-600 print:border-black print:pt-2">
          <div className="text-right space-y-1 min-w-[200px]">
            {(bill.discountPercent ?? 0) > 0 && (
              <>
                <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 print:text-gray-700">
                  <span>Subtotal:</span>
                  <span>Rs. {(bill.subtotal ?? bill.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 print:text-gray-700">
                  <span>Discount ({bill.discountPercent}%):</span>
                  <span>− Rs. {(bill.discountAmount ?? 0).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-zinc-300 pt-1 dark:border-zinc-600 print:border-black">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50 print:text-black">
                Total:
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50 print:text-black">
                Rs. {bill.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500 print:text-gray-500 print:mt-3">
          <p>We wish you good health</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 px-4 py-6 sm:px-6 sm:py-8">
      {/* Action buttons — hidden when printing */}
      <div className="mx-auto max-w-2xl mb-4 flex flex-wrap gap-2 sm:gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Print Bill
        </button>
        {!bill.paid ? (
          <button
            onClick={handleMarkPaid}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Mark as Paid
          </button>
        ) : (
          <span className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            Paid
          </span>
        )}
        {canEdit && (
          <>
            <button
              onClick={() => router.push(`/bills/${id}/edit`)}
              className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              Edit Bill
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
            >
              Delete
            </button>
          </>
        )}
        <button
          onClick={() => router.push("/billing")}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          New Bill
        </button>
        <button
          onClick={() => router.push(bill.paid ? "/sales" : "/bills")}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {bill.paid ? "All Sales" : "All Bills"}
        </button>
      </div>

      {/* Screen-only single copy */}
      <div className="print:hidden">
        <BillCopy />
      </div>

      {/* Print-only: two copies on same page */}
      <div className="hidden print:block">
        <BillCopy label="Customer Copy" />
        <div className="my-10 border-t border-dashed border-gray-500 pt-2 text-center text-[10px] text-gray-500">
          — — — — — — — — — — — — cut here — — — — — — — — — — — —
        </div>
        <BillCopy label="Office Copy" />
      </div>
    </div>
  );
}
