import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { budgetApi, studentsApi } from "../api";

export default function Budget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    Promise.all([budgetApi.list(), studentsApi.list()])
      .then(([bRes, sRes]) => {
        setBudget(bRes.data);
        setStudents(sRes.data);
      })
      .catch(() => setError("Failed to load budget data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading budget...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Budget</h2>
      <div className="bg-white rounded shadow p-4 h-72">
        <h3 className="font-semibold mb-2">Expenditure vs Allocation</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={budget}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="allocated_amount" fill="#1a6b3c" />
            <Bar dataKey="spent_amount" fill="#68d391" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">Fee Collection Tracker</h3>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50"><th className="p-2 text-left">Student</th><th className="p-2">Fee Balance</th></tr></thead>
            <tbody>
              {students.slice(0, 200).map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.first_name} {s.last_name}</td>
                  <td className="p-2 text-center">KES {s.fee_balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
