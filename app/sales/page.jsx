"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SalesPage() {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [saving, setSaving] = useState(false);

  function fetchSales() {
    fetch("/api/bills?paid=true")
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
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUser(data.user))
      .catch(() => {});
    fetchSales();
  }, []);

  const isAdmin = user?.role === "admin";

  function startEdit(bill) {
    setEditingId(bill._id);
    setCustomerName(bill.customerName || "");
    setCart(
      bill.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
      }))
    );
    setSearch("");
    // Fetch products if not loaded yet
    if (products.length === 0) {
      fetch("/api/products")
        .then((r) => r.json())
        .then((data) => setProducts(data.products))
        .catch(() => {});
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setCart([]);
    setCustomerName("");
    setSearch("");
  }

  function addToCart(product) {
    const existing = cart.find((c) => c.productId === product._id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          productName: product.name,
          productPrice: product.price,
          quantity: 1,
        },
      ]);
    }
  }

  function updateQuantity(productId, qty) {
    const quantity = Math.max(1, Number(qty) || 1);
    setCart(
      cart.map((c) => (c.productId === productId ? { ...c, quantity } : c))
    );
  }

  function removeFromCart(productId) {
    setCart(cart.filter((c) => c.productId !== productId));
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.productPrice * c.quantity, 0);

  async function handleSave() {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bills/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update");
        return;
      }
      cancelEdit();
      fetchSales();
    } catch {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this sale? Stock will be restored.")) return;
    const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingId === id) cancelEdit();
      fetchSales();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete");
    }
  }

  const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Sales
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {bills.length} paid bill{bills.length !== 1 ? "s" : ""} — Revenue:{" "}
              <span className="font-semibold text-green-600 dark:text-green-400">
                ₹{totalRevenue.toFixed(2)}
              </span>
            </p>
          </div>
          <Link
            href="/bills"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Unpaid Bills
          </Link>
        </div>

        {bills.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            No sales yet
          </div>
        )}

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {bills.map((b) => (
            <div key={b._id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-50">#{b.billNumber}</span>
                <span className="font-medium text-green-700 dark:text-green-400">₹{b.totalAmount.toFixed(2)}</span>
              </div>
              {(b.discountPercent ?? 0) > 0 && (
                <div className="mb-2 text-xs text-red-600 dark:text-red-400">
                  Discount: {b.discountPercent}% (−₹{(b.discountAmount ?? 0).toFixed(2)})
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                <span>{b.customerName || "No customer"}</span>
                <span>{b.paidAt ? new Date(b.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <Link href={`/bills/${b._id}`} className="text-blue-600 dark:text-blue-400">View</Link>
                {isAdmin && (
                  <>
                    <button onClick={() => startEdit(b)} className="text-zinc-600 dark:text-zinc-400">Edit</button>
                    <button onClick={() => handleDelete(b._id)} className="text-red-600 dark:text-red-400">Delete</button>
                  </>
                )}
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
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Paid On</th>
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
                    <td className="px-4 py-3 text-right font-medium text-green-700 dark:text-green-400">₹{b.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {b.paidAt ? new Date(b.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link href={`/bills/${b._id}`} className="text-blue-600 hover:underline dark:text-blue-400">View</Link>
                      {isAdmin && (
                        <>
                          <button onClick={() => startEdit(b)} className="text-zinc-600 hover:underline dark:text-zinc-400">Edit</button>
                          <button onClick={() => handleDelete(b._id)} className="text-red-600 hover:underline dark:text-red-400">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit modal */}
        {editingId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => e.target === e.currentTarget && cancelEdit()}
          >
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900 rounded-t-2xl">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Edit Sale — Bill #{bills.find((b) => b._id === editingId)?.billNumber}
                </h2>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-5">
                {/* Product search */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Products
                  </label>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800">
                    {filtered.length === 0 && (
                      <p className="py-6 text-center text-sm text-zinc-400">
                        No products found
                      </p>
                    )}
                    {filtered.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between border-b border-zinc-100 px-3 py-2.5 last:border-0 dark:border-zinc-800"
                      >
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">
                            {p.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            ₹{p.price.toFixed(2)} / {p.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Customer
                  </label>
                  <input
                    type="text"
                    placeholder="Customer name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />

                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Items
                  </label>

                  {cart.length === 0 && (
                    <p className="py-6 text-center text-sm text-zinc-400">
                      No items
                    </p>
                  )}

                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="rounded-lg border border-zinc-100 p-2.5 dark:border-zinc-800"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {item.productName}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.productId, e.target.value)
                              }
                              className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                            />
                            <span className="text-xs text-zinc-400">
                              × ₹{item.productPrice.toFixed(2)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            ₹{(item.productPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {cart.length > 0 && (
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
                      <span className="font-bold text-zinc-900 dark:text-zinc-50">
                        Total
                      </span>
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        ₹{cartTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-950 rounded-b-2xl">
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || cart.length === 0}
                  className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
