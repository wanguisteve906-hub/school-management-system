import { useEffect, useMemo, useState } from "react";

import { inventoryApi } from "../api";

const badgeStyles = {
  Good: "bg-green-100 text-green-700",
  Fair: "bg-yellow-100 text-yellow-700",
  Damaged: "bg-red-100 text-red-700"
};

export default function Inventory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    inventoryApi.list()
      .then((res) => setItems(res.data))
      .catch(() => setError("Failed to load inventory"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => `${item.item_name} ${item.category}`.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading inventory...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Inventory</h2>
      <input className="border p-2 rounded w-full max-w-sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter inventory..." />
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50"><th className="p-2 text-left">Item</th><th className="p-2">Category</th><th className="p-2">Qty</th><th className="p-2">Condition</th></tr></thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-2">{i.item_name}</td>
                <td className="p-2 text-center">{i.category}</td>
                <td className="p-2 text-center">{i.quantity}</td>
                <td className="p-2 text-center"><span className={`px-2 py-1 rounded-full text-xs ${badgeStyles[i.condition] || "bg-gray-100 text-gray-700"}`}>{i.condition}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
