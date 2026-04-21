import { useEffect, useState } from "react";

import { feesApi, studentsApi } from "../api";

export default function FeeBalances() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    studentsApi
      .list()
      .then(async (res) => {
        const requests = res.data.map((s) => feesApi.getBalance(s.id).catch(() => null));
        const results = await Promise.all(requests);
        const rows = results.filter(Boolean).map((r) => r.data);
        setBalances(rows.sort((a, b) => b.balance - a.balance));
      })
      .catch(() => setError("Failed to load student balances"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading fee balances...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Fee Balances</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Student</th>
              <th className="p-2 text-center">Total Owed</th>
              <th className="p-2 text-center">Total Paid</th>
              <th className="p-2 text-center">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b) => (
              <tr key={b.student_id} className="border-t">
                <td className="p-2">{b.student_name}</td>
                <td className="p-2 text-center">KES {b.total_owed.toLocaleString()}</td>
                <td className="p-2 text-center">KES {b.total_paid.toLocaleString()}</td>
                <td className={`p-2 text-center font-semibold ${b.balance > 0 ? "text-red-600" : "text-green-700"}`}>
                  KES {b.balance.toLocaleString()}
                </td>
              </tr>
            ))}
            {balances.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-500">
                  No balances found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
