"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", unit: "piece", stock: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    if (!res.ok) {
      if (res.status === 401) return router.push("/login");
      return;
    }
    const data = await res.json();
    setProducts(data.products);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", price: "", unit: "piece", stock: "" });
    setError("");
    setShowModal(true);
  }

  function openEdit(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      price: String(product.price),
      unit: product.unit,
      stock: String(product.stock),
    });
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm({ name: "", price: "", unit: "piece", stock: "" });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.price) {
      setError("Name and price are required");
      return;
    }

    setSaving(true);
    const body = {
      name: form.name,
      price: Number(form.price),
      unit: form.unit,
      stock: Number(form.stock) || 0,
    };

    let res;
    if (editingId) {
      res = await fetch(`/api/products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save product");
      setSaving(false);
      return;
    }

    setSaving(false);
    closeModal();
    fetchProducts();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  }

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
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Products
          </h1>
          <button
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add Product
          </button>
        </div>

        {products.length > 0 && (
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        )}

        {filtered.length === 0 && products.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            No products yet. Tap &quot;Add Product&quot; to get started.
          </div>
        )}

        {filtered.length === 0 && products.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            No products match &quot;{search}&quot;
          </div>
        )}

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {filtered.map((p) => (
            <div key={p._id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">₹{p.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                <span>{p.unit}</span>
                <span>Stock: {p.stock}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => openEdit(p)} className="text-blue-600 dark:text-blue-400">Edit</button>
                <button onClick={() => handleDelete(p._id)} className="text-red-600 dark:text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        {filtered.length > 0 && (
          <div className="hidden md:block rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Unit</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Stock</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{p.name}</td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">₹{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{p.unit}</td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{p.stock}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline dark:text-blue-400">Edit</button>
                      <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline dark:text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {editingId ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="strip, bottle"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
