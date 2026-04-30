import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { analyticsApi, gradesApi, staffApi } from "../api";

export default function Staff() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [teacherDetail, setTeacherDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([staffApi.list(), gradesApi.list()])
      .then(([sRes, gRes]) => {
        setStaff(sRes.data);
        setGrades(gRes.data);
      })
      .catch(() => setError("Failed to load staff records"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) {
      setTeacherDetail(null);
      return;
    }
    analyticsApi
      .teacherDrilldown(selectedTeacherId)
      .then((res) => setTeacherDetail(res.data))
      .catch(() => setTeacherDetail(null));
  }, [selectedTeacherId]);

  const teacherPerf = useMemo(() => {
    return staff.map((t) => {
      const g = grades.filter((x) => x.teacher_id === t.id);
      const mean = g.length ? g.reduce((acc, cur) => acc + cur.marks, 0) / g.length : 0;
      const forms = [...new Set(g.map((x) => x.student?.form).filter(Boolean))].sort((a, b) => a - b);
      const taughtSubjects = [...new Set(g.map((x) => x.subject).filter(Boolean))].sort();
      return {
        id: t.id,
        staff_no: t.staff_no,
        name: `${t.first_name} ${t.last_name}`,
        subject: taughtSubjects.length ? taughtSubjects.join(", ") : t.subject,
        subjectList: taughtSubjects,
        formList: forms,
        classes: forms.length ? forms.map((f) => `Form ${f}`).join(", ") : "-",
        mean: Number(mean.toFixed(2)),
      };
    });
  }, [staff, grades]);

  const rankedTeachers = useMemo(() => {
    const sorted = [...teacherPerf].sort((a, b) => b.mean - a.mean);
    let lastScore = null;
    let lastRank = 0;
    return sorted.map((row, idx) => {
      if (lastScore === null || row.mean !== lastScore) {
        lastRank = idx + 1;
        lastScore = row.mean;
      }
      return { ...row, rank: lastRank };
    });
  }, [teacherPerf]);

  const subjectOptions = useMemo(() => {
    const all = new Set();
    rankedTeachers.forEach((t) => t.subjectList?.forEach((s) => all.add(s)));
    return [...all].sort();
  }, [rankedTeachers]);

  const formOptions = useMemo(() => {
    const all = new Set();
    rankedTeachers.forEach((t) => t.formList?.forEach((f) => all.add(f)));
    return [...all].sort((a, b) => a - b);
  }, [rankedTeachers]);

  const visibleTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = rankedTeachers.filter((t) => {
      if (q && !(t.name.toLowerCase().includes(q) || t.staff_no.toLowerCase().includes(q))) return false;
      if (formFilter && !(t.formList ?? []).includes(Number(formFilter))) return false;
      if (subjectFilter && !(t.subjectList ?? []).includes(subjectFilter)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "mean") return b.mean - a.mean;
      return a.rank - b.rank;
    });
    return rows;
  }, [rankedTeachers, search, formFilter, subjectFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visibleTeachers.length / pageSize));
  const pagedTeachers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visibleTeachers.slice(start, start + pageSize);
  }, [visibleTeachers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, formFilter, subjectFilter, sortBy, pageSize]);

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading staff...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Staff</h2>
      <div className="bg-white rounded shadow p-3 grid md:grid-cols-6 gap-2 items-center">
        <input
          className="border rounded p-2"
          placeholder="Search by name or staff no"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="border rounded p-2" value={formFilter} onChange={(e) => setFormFilter(e.target.value)}>
          <option value="">All Forms</option>
          {formOptions.map((f) => (
            <option key={f} value={f}>
              Form {f}
            </option>
          ))}
        </select>
        <select className="border rounded p-2" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">All Subjects</option>
          {subjectOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="border rounded p-2" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="rank">Sort: Rank</option>
          <option value="mean">Sort: Mean Score</option>
          <option value="name">Sort: Name</option>
        </select>
        <select className="border rounded p-2" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <button
          type="button"
          className="border rounded p-2 hover:bg-gray-50"
          onClick={() => {
            setSearch("");
            setFormFilter("");
            setSubjectFilter("");
            setSortBy("rank");
            setPageSize(10);
            setPage(1);
          }}
        >
          Clear Filters
        </button>
        <div className="text-sm text-gray-600 text-right">
          Showing {pagedTeachers.length} / {visibleTeachers.length}
        </div>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Staff No</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Class</th>
              <th className="p-2 text-left">Subject</th>
              <th className="p-2 text-left">Rank</th>
            </tr>
          </thead>
          <tbody>
            {pagedTeachers.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.staff_no}</td>
                <td className="p-2">
                  <button
                    type="button"
                    className="text-blue-700 hover:underline"
                    onClick={() => setSelectedTeacherId(s.id)}
                  >
                    {s.name}
                  </button>
                </td>
                <td className="p-2">{s.classes}</td>
                <td className="p-2">{s.subject}</td>
                <td className="p-2">
                  <RankMedal rank={s.rank} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded shadow p-4 h-72">
        <h3 className="font-semibold mb-2">Per-teacher Subject Performance</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={pagedTeachers}><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Bar dataKey="mean" fill="#1a6b3c" /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="border rounded px-3 py-1 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="border rounded px-3 py-1 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">Teacher Drill-Down</h3>
        {!teacherDetail ? (
          <p className="text-sm text-gray-600">Click a teacher name to view analytics details.</p>
        ) : (
          <div className="space-y-1 text-sm">
            <p>Name: <strong>{teacherDetail.teacher_name}</strong></p>
            <p>Subject(s): <strong>{teacherDetail.subject}</strong></p>
            <p>Overall Mean: <strong>{teacherDetail.overall_mean_score}</strong></p>
            <p>Forms taught: {teacherDetail.forms_taught?.join(", ") || "-"}</p>
            <p>
              Rank: <strong>{teacherDetail.teacher_rank ?? "-"}</strong> / {teacherDetail.teachers_compared ?? 0}
            </p>
            <p>KCSE As last year (Form 4): <strong>{teacherDetail.kcse_a_count_last_year ?? 0}</strong></p>
            <div className="pt-2">
              <p className="font-semibold">Performance by Form</p>
              {(teacherDetail.form_performance ?? []).map((row) => (
                <p key={row.form}>Form {row.form}: {row.mean_score} ({row.records} records)</p>
              ))}
            </div>
            <div className="pt-2">
              <p className="font-semibold">Performance by Subject</p>
              {(teacherDetail.subject_performance ?? []).map((row) => (
                <p key={row.subject}>{row.subject}: {row.mean_score} ({row.records} records)</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RankMedal({ rank }) {
  if (rank <= 2) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-yellow-500 bg-yellow-300 text-yellow-900 font-bold">
          {rank}
        </span>
        <span className="text-xs font-semibold text-yellow-700">Gold</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-400 bg-gray-200 text-gray-800 font-bold">
          {rank}
        </span>
        <span className="text-xs font-semibold text-gray-600">Silver</span>
      </span>
    );
  }
  if (rank === 4) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-700 bg-amber-500 text-amber-950 font-bold">
          {rank}
        </span>
        <span className="text-xs font-semibold text-amber-700">Bronze</span>
      </span>
    );
  }
  return <span className="text-xs text-gray-500">#{rank}</span>;
}
