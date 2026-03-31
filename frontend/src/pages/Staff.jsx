import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { gradesApi, staffApi } from "../api";

export default function Staff() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    Promise.all([staffApi.list(), gradesApi.list()])
      .then(([sRes, gRes]) => {
        setStaff(sRes.data);
        setGrades(gRes.data);
      })
      .catch(() => setError("Failed to load staff records"))
      .finally(() => setLoading(false));
  }, []);

  const teacherPerf = useMemo(() => {
    return staff.map((t) => {
      const g = grades.filter((x) => x.teacher_id === t.id);
      const mean = g.length ? g.reduce((acc, cur) => acc + cur.marks, 0) / g.length : 0;
      return { teacher: `${t.first_name} ${t.last_name}`, mean: Number(mean.toFixed(2)) };
    });
  }, [staff, grades]);

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading staff...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Staff</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50"><th className="p-2 text-left">Staff No</th><th className="p-2 text-left">Name</th><th className="p-2">Subject</th></tr></thead>
          <tbody>{staff.map((s) => <tr key={s.id} className="border-t"><td className="p-2">{s.staff_no}</td><td className="p-2">{s.first_name} {s.last_name}</td><td className="p-2 text-center">{s.subject}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="bg-white rounded shadow p-4 h-72">
        <h3 className="font-semibold mb-2">Per-teacher Subject Performance</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={teacherPerf}><XAxis dataKey="teacher" hide /><YAxis /><Tooltip /><Bar dataKey="mean" fill="#1a6b3c" /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
