"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditBillPage() {
  const { id } = useParams();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [billNumber, setBillNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/bills/${id}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch("/api/products").then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
    ])
      .then(([billData, prodData]) => {
        const bill = billData.bill;
        setBillNumber(bill.billNumber);
        setCustomerName(bill.customerName || "");
        setCart(
          bill.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            quantity: item.quantity,
          }))
        );
        setProducts(prodData.products);
        setLoading(false);
      })
      .catch(() => router.push("/bills"));
  }, [id]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const total = cart.reduce((sum, c) => sum + c.productPrice * c.quantity, 0);

  async function handleUpdate() {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          items: cart.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update bill");
        return;
      }

      router.push(`/bills/${id}`);
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
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
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
          Edit Bill #{billNumber}
        </h1>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Product selection */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />

              <div className="max-h-96 overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="py-8 text-center text-sm text-zinc-400">
                    No products found
                  </p>
                )}
                {filtered.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">
                        {p.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        ₹{p.price.toFixed(2)} / {p.unit} — Stock: {p.stock}
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
          </div>

          {/* Cart */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                Order Items
              </h2>

              <input
                type="text"
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />

              {cart.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-400">
                  Add products to the bill
                </p>
              )}

              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
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
                    <div className="mt-2 flex items-center justify-between">
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
                <>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Total
                    </span>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => router.push(`/bills/${id}`)}
                      className="rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
