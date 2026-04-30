import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { gradesApi, studentsApi } from "../api";

const PAGE_SIZE = 20;
const FORMS = [1, 2, 3, 4];
const STREAMS = ["North", "South", "East", "West", "Central"];

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [kcpeMin, setKcpeMin] = useState("");
  const [kcpeMax, setKcpeMax] = useState("");

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [grades, setGrades] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchData = () => {
    setLoading(true);
    const params = {
      skip,
      limit,
      ...(query && { q: query }),
      ...(formFilter && { form: formFilter }),
      ...(streamFilter && { stream: streamFilter }),
      ...(kcpeMin && { kcpe_min: kcpeMin }),
      ...(kcpeMax && { kcpe_max: kcpeMax }),
    };
    studentsApi.list(params)
      .then((res) => {
        setStudents(res.data.students);
        setTotal(res.data.total);
      })
      .catch(() => setError("Failed to load students"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [skip, limit, formFilter, streamFilter, kcpeMin, kcpeMax]);

  useEffect(() => {
    gradesApi.list().then((res) => setGrades(res.data)).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  const handleSearch = () => {
    setSkip(0);
    fetchData();
  };

  const handlePrev = () => {
    if (skip >= PAGE_SIZE) {
      setSkip(skip - PAGE_SIZE);
    }
  };

  const handleNext = () => {
    if (skip + PAGE_SIZE < total) {
      setSkip(skip + PAGE_SIZE);
    }
  };

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

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by name or admission..."
          className="border px-3 py-2 rounded w-full"
        />
        <select
          value={formFilter}
          onChange={(e) => { setFormFilter(e.target.value); setSkip(0); }}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="">All Forms</option>
          {FORMS.map((f) => (
            <option key={f} value={f}>Form {f}</option>
          ))}
        </select>
        <select
          value={streamFilter}
          onChange={(e) => { setStreamFilter(e.target.value); setSkip(0); }}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="">All Streams</option>
          {STREAMS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="number"
          value={kcpeMin}
          onChange={(e) => { setKcpeMin(e.target.value); setSkip(0); }}
          placeholder="KCPE Min"
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="number"
          value={kcpeMax}
          onChange={(e) => { setKcpeMax(e.target.value); setSkip(0); }}
          placeholder="KCPE Max"
          className="border px-3 py-2 rounded w-full"
        />
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {students.length} of {total} students
          {currentPage > 0 && <span> (Page {currentPage} of {totalPages})</span>}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={skip === 0}
            className="px-4 py-2 bg-elimuGreen text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={handleNext}
            disabled={skip + PAGE_SIZE >= total}
            className="px-4 py-2 bg-elimuGreen text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Adm No</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2">Form</th>
              <th className="p-2">Stream</th>
              <th className="p-2">KCPE</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr
                key={s.id}
                className="border-t cursor-pointer hover:bg-green-50"
                onClick={() => setSelected(s)}
              >
                <td className="p-2">{s.admission_no}</td>
                <td className="p-2">{s.first_name} {s.last_name}</td>
                <td className="p-2 text-center">{s.form}</td>
                <td className="p-2 text-center">{s.stream}</td>
                <td className="p-2 text-center">{s.kcpe_score ?? "-"}</td>
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
