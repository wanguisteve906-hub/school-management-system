import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { gradesApi } from "../api";

export default function Grades() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [grades, setGrades] = useState([]);
  const [form, setForm] = useState("");
  const [stream, setStream] = useState("");
  const [term, setTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (form) params.append("form", form);
    if (stream) params.append("stream", stream);
    if (term) params.append("term", term);
    gradesApi.list(params.toString())
      .then((res) => setGrades(res.data))
      .catch(() => setError("Failed to load grades"))
      .finally(() => setLoading(false));
  }, [form, stream, term]);

  const filtered = useMemo(() => grades, [grades]);

  const comparison = useMemo(() => {
    const byTerm = {};
    filtered.forEach((g) => {
      byTerm[g.term] = byTerm[g.term] || { term: `Term ${g.term}`, total: 0, count: 0 };
      byTerm[g.term].total += g.marks;
      byTerm[g.term].count += 1;
    });
    return Object.values(byTerm).map((r) => ({ term: r.term, mean: Number((r.total / r.count).toFixed(2)) }));
  }, [filtered]);

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading grades...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Grades</h2>
      <div className="flex gap-2">
        <select className="border p-2 rounded" value={form} onChange={(e) => setForm(e.target.value)}><option value="">All Forms</option><option value="1">Form 1</option><option value="2">Form 2</option><option value="3">Form 3</option><option value="4">Form 4</option></select>
        <select className="border p-2 rounded" value={stream} onChange={(e) => setStream(e.target.value)}><option value="">All Streams</option><option>East</option><option>West</option><option>North</option></select>
        <select className="border p-2 rounded" value={term} onChange={(e) => setTerm(e.target.value)}><option value="">All Terms</option><option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option></select>
      </div>
      <div className="bg-white rounded shadow overflow-auto max-h-80">
        <table className="w-full text-sm"><thead><tr className="bg-gray-50"><th className="p-2">Student ID</th><th className="p-2">Subject</th><th className="p-2">Term</th><th className="p-2">Marks</th><th className="p-2">Grade</th></tr></thead>
          <tbody>{filtered.slice(0, 400).map((g) => <tr key={g.id} className="border-t"><td className="p-2 text-center">{g.student_id}</td><td className="p-2">{g.subject}</td><td className="p-2 text-center">{g.term}</td><td className="p-2 text-center">{g.marks}</td><td className="p-2 text-center">{g.grade}</td></tr>)}</tbody></table>
      </div>
      <div className="bg-white rounded shadow p-4 h-72">
        <h3 className="font-semibold mb-2">Term Performance Comparison</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={comparison}><XAxis dataKey="term" /><YAxis /><Tooltip /><Bar dataKey="mean" fill="#1a6b3c" /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
