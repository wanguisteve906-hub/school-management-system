import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

import { budgetApi, gradesApi, staffApi, studentsApi } from "../api";

const colors = ["#1a6b3c", "#2f855a", "#48bb78", "#68d391", "#9ae6b4"];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({ students: 0, staff: 0 });
  const [performance, setPerformance] = useState([]);
  const [budget, setBudget] = useState([]);

  useEffect(() => {
    Promise.all([studentsApi.list(), staffApi.list(), gradesApi.classPerformance(), budgetApi.list()])
      .then(([studentsRes, staffRes, perfRes, budgetRes]) => {
        setMetrics({ students: studentsRes.data.length, staff: staffRes.data.length });
        setPerformance(perfRes.data.data || []);
        setBudget(budgetRes.data);
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading dashboard...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-elimuGreen">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">Students: <span className="font-bold">{metrics.students}</span></div>
        <div className="bg-white p-4 rounded shadow">Staff: <span className="font-bold">{metrics.staff}</span></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow h-72">
          <h3 className="font-semibold mb-2">Form Performance</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={performance}>
              <XAxis dataKey="stream" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mean_score" fill="#1a6b3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded shadow h-72">
          <h3 className="font-semibold mb-2">Budget Allocation</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={budget} dataKey="allocated_amount" nameKey="category" outerRadius={90} label>
                {budget.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
