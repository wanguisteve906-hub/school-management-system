import { useEffect, useState } from "react";

import { feesApi } from "../api";

export default function FeeStructures() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [structures, setStructures] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    grade: 1,
    term: 1,
    amount: "",
    year: new Date().getFullYear(),
    description: "",
  });

  const loadStructures = async () => {
    try {
      const res = await feesApi.listStructures();
      setStructures(res.data);
    } catch {
      setError("Failed to load fee structures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const createStructure = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await feesApi.createStructure({
        ...formData,
        amount: Number(formData.amount),
      });
      setFormData({
        name: "",
        grade: 1,
        term: 1,
        amount: "",
        year: new Date().getFullYear(),
        description: "",
      });
      await loadStructures();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to create fee structure");
    }
  };

  const assignStructure = async (feeId, grade) => {
    try {
      await feesApi.assignToGrade(feeId, grade);
      await loadStructures();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to assign fee");
    }
  };

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading fee structures...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Fee Structures</h2>

      <form onSubmit={createStructure} className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Fee name (e.g. Tuition)"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <select
          className="border rounded px-3 py-2"
          value={formData.grade}
          onChange={(e) => setFormData((p) => ({ ...p, grade: Number(e.target.value) }))}
        >
          {[1, 2, 3, 4].map((g) => (
            <option key={g} value={g}>
              Form {g}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-3 py-2"
          value={formData.term}
          onChange={(e) => setFormData((p) => ({ ...p, term: Number(e.target.value) }))}
        >
          {[1, 2, 3].map((t) => (
            <option key={t} value={t}>
              Term {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="border rounded px-3 py-2"
          placeholder="Amount (KES)"
          value={formData.amount}
          onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
          required
        />
        <input
          type="number"
          className="border rounded px-3 py-2"
          placeholder="Year"
          value={formData.year}
          onChange={(e) => setFormData((p) => ({ ...p, year: Number(e.target.value) }))}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
        />
        <div className="md:col-span-3">
          <button type="submit" className="bg-elimuGreen text-white rounded px-4 py-2">
            Create Fee Structure
          </button>
        </div>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Fee</th>
              <th className="p-2">Form</th>
              <th className="p-2">Term</th>
              <th className="p-2">Year</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {structures.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-center">Form {item.grade}</td>
                <td className="p-2 text-center">Term {item.term}</td>
                <td className="p-2 text-center">{item.year}</td>
                <td className="p-2 text-center">KES {item.amount.toLocaleString()}</td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => assignStructure(item.id, item.grade)}
                    className="text-elimuGreen hover:underline"
                  >
                    Assign to Form {item.grade}
                  </button>
                </td>
              </tr>
            ))}
            {structures.length === 0 && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan={6}>
                  No fee structures yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
