import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { gradesApi, studentsApi } from "../api";

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([studentsApi.list(), gradesApi.list()])
      .then(([sRes, gRes]) => {
        setStudents(sRes.data);
        setGrades(gRes.data);
      })
      .catch(() => setError("Failed to load students"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      students.filter((s) =>
        `${s.first_name} ${s.last_name} ${s.admission_no}`.toLowerCase().includes(query.toLowerCase())
      ),
    [students, query]
  );

  const selectedGrades = useMemo(() => {
    if (!selected) return [];
    return grades
      .filter((g) => g.student_id === selected.id)
      .slice(0, 10)
      .map((g) => ({ subject: g.subject, marks: g.marks }));
  }, [selected, grades]);

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading students...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Students</h2>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students..." className="border px-3 py-2 rounded w-full max-w-md" />
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="p-2 text-left">Adm No</th><th className="p-2 text-left">Name</th><th className="p-2">Form</th><th className="p-2">Stream</th></tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t cursor-pointer hover:bg-green-50" onClick={() => setSelected(s)}>
                <td className="p-2">{s.admission_no}</td><td className="p-2">{s.first_name} {s.last_name}</td><td className="p-2 text-center">{s.form}</td><td className="p-2 text-center">{s.stream}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">{selected.first_name} {selected.last_name}</h3>
            <button onClick={() => setSelected(null)} className="text-red-600">Close</button>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedGrades}>
                <XAxis dataKey="subject" /><YAxis /><Tooltip /><Line dataKey="marks" stroke="#1a6b3c" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
