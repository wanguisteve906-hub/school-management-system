import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { analyticsApi, gradesApi } from "../api";

const PIE_COLORS = ["#166534", "#1d4ed8", "#ea580c", "#7c3aed", "#dc2626", "#0f766e", "#4338ca", "#4b5563"];

function toQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.append(k, v);
  });
  return params.toString();
}

export default function Performance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rankingEnabled, setRankingEnabled] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({ form: "", stream: "", term: "", year: "", subject: "" });

  const [overview, setOverview] = useState(null);
  const [teacherInsights, setTeacherInsights] = useState({ best: null, worst: null, rows: [] });
  const [streams, setStreams] = useState([]);
  const [rankingsOutliers, setRankingsOutliers] = useState({
    top_students: [],
    bottom_students: [],
    improvers: [],
    drops: [],
    failing: [],
  });
  const [studentDetail, setStudentDetail] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherDetail, setTeacherDetail] = useState(null);

  useEffect(() => {
    gradesApi
      .list()
      .then((res) => setRecords(res.data ?? []))
      .catch(() => setError("Failed to load base records"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!records.length) return;
    const q = toQuery(filters);
    Promise.all([
      analyticsApi.overview(q),
      analyticsApi.subjectTeacher(q),
      analyticsApi.streams(q),
      analyticsApi.rankingsOutliers(q),
    ])
      .then(([overviewRes, teacherRes, streamRes, rankingRes]) => {
        setOverview(overviewRes.data);
        setTeacherInsights(teacherRes.data);
        setStreams(streamRes.data ?? []);
        setRankingsOutliers(rankingRes.data);
      })
      .catch(() => setError("Failed to load analytics endpoints"));
  }, [filters, records.length]);

  useEffect(() => {
    if (!selectedStudent) {
      setStudentDetail(null);
      return;
    }
    const q = toQuery(filters);
    analyticsApi
      .studentDrilldown(selectedStudent, q)
      .then((res) => setStudentDetail(res.data))
      .catch(() => setStudentDetail(null));
  }, [selectedStudent, filters]);

  useEffect(() => {
    if (!selectedTeacher) {
      setTeacherDetail(null);
      return;
    }
    const q = toQuery(filters);
    analyticsApi
      .teacherDrilldown(selectedTeacher, q)
      .then((res) => setTeacherDetail(res.data))
      .catch(() => setTeacherDetail(null));
  }, [selectedTeacher, filters]);

  const years = useMemo(() => [...new Set(records.map((r) => r.year).filter(Boolean))].sort(), [records]);
  const subjects = useMemo(() => [...new Set(records.map((r) => r.subject).filter(Boolean))].sort(), [records]);
  const streamOptions = useMemo(() => [...new Set(records.map((r) => r.student?.stream).filter(Boolean))].sort(), [records]);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (filters.form && String(r.student?.form ?? "") !== filters.form) return false;
        if (filters.stream && (r.student?.stream ?? "") !== filters.stream) return false;
        if (filters.term && String(r.term) !== filters.term) return false;
        if (filters.year && String(r.year) !== filters.year) return false;
        if (filters.subject && r.subject !== filters.subject) return false;
        return true;
      }),
    [records, filters]
  );

  const subjectMeans = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const v = map.get(r.subject) ?? { subject: r.subject, total: 0, count: 0 };
      v.total += r.marks;
      v.count += 1;
      map.set(r.subject, v);
    });
    return [...map.values()].map((v) => ({ subject: v.subject, mean: Number((v.total / v.count).toFixed(2)) }));
  }, [filtered]);

  const termTrend = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const v = map.get(r.term) ?? { term: r.term, total: 0, count: 0 };
      v.total += r.marks;
      v.count += 1;
      map.set(r.term, v);
    });
    return [...map.values()]
      .sort((a, b) => a.term - b.term)
      .map((v) => ({ term: `Term ${v.term}`, mean: Number((v.total / v.count).toFixed(2)) }));
  }, [filtered]);

  const gradeDistribution = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => map.set(r.grade, (map.get(r.grade) ?? 0) + 1));
    return [...map.entries()].map(([grade, count]) => ({ grade, count }));
  }, [filtered]);

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading performance dashboard...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-elimuGreen">Performance Analytics</h2>
        <p className="text-sm text-gray-600">Backend-powered analytics + teacher subject insights.</p>
      </div>

      <div className="bg-white rounded shadow p-4 grid md:grid-cols-6 gap-2">
        <FilterSelect value={filters.form} onChange={(v) => setFilters((f) => ({ ...f, form: v }))} options={["1", "2", "3", "4"]} placeholder="All Forms" labelPrefix="Form " />
        <FilterSelect value={filters.stream} onChange={(v) => setFilters((f) => ({ ...f, stream: v }))} options={streamOptions} placeholder="All Streams" />
        <FilterSelect value={filters.term} onChange={(v) => setFilters((f) => ({ ...f, term: v }))} options={["1", "2", "3"]} placeholder="All Terms" labelPrefix="Term " />
        <FilterSelect value={filters.year} onChange={(v) => setFilters((f) => ({ ...f, year: v }))} options={years.map(String)} placeholder="All Years" />
        <FilterSelect value={filters.subject} onChange={(v) => setFilters((f) => ({ ...f, subject: v }))} options={subjects} placeholder="All Subjects" />
        <button type="button" className="border rounded px-3 py-2 hover:bg-gray-50" onClick={() => setRankingEnabled((v) => !v)}>
          Ranking: {rankingEnabled ? "Enabled" : "CBC Mode"}
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-3">
        <Metric title="Mean Score" value={overview?.mean_score ?? 0} />
        <Metric title="Mean Grade" value={overview?.mean_grade ?? "N/A"} />
        <Metric title="Total Students" value={overview?.total_students ?? 0} />
        <Metric title="Pass Rate (%)" value={overview?.pass_rate ?? 0} />
        <Metric title="Std Deviation" value={overview?.standard_deviation ?? 0} />
        <Metric title="KCSE As Last Year" value={overview?.kcse_a_count_last_year ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Mean Score per Subject">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={subjectMeans}>
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mean" fill="#1a6b3c" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Term Trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={termTrend}>
              <XAxis dataKey="term" />
              <YAxis />
              <Tooltip />
              <Line dataKey="mean" stroke="#1a6b3c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Grade Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={gradeDistribution} dataKey="count" nameKey="grade" outerRadius={85} label>
                {gradeDistribution.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Heatmap (Subject vs Stream)">
          <div className="max-h-56 overflow-auto text-sm">
            {filtered.slice(0, 120).map((r) => (
              <div key={r.id} className="grid grid-cols-3 border-t py-1">
                <span>{r.subject}</span>
                <span>{r.student?.stream ?? "-"}</span>
                <span className={r.marks >= 70 ? "text-green-700" : r.marks < 40 ? "text-red-700" : "text-amber-700"}>{r.marks}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Teacher Subject Insights">
          <p className="text-sm">Best: <strong>{teacherInsights.best ? `${teacherInsights.best.subject} - ${teacherInsights.best.teacher}` : "-"}</strong></p>
          <p className="text-sm mb-2">Worst: <strong>{teacherInsights.worst ? `${teacherInsights.worst.subject} - ${teacherInsights.worst.teacher}` : "-"}</strong></p>
          <div className="max-h-48 overflow-auto">
            {teacherInsights.rows.slice(0, 12).map((row) => (
              <div key={`${row.subject}-${row.teacher}`} className="grid grid-cols-3 border-t text-sm py-1">
                <span>{row.subject}</span>
                <span>
                  {row.teacher_id ? (
                    <button type="button" className="text-blue-700 hover:underline" onClick={() => setSelectedTeacher(row.teacher_id)}>
                      {row.teacher}
                    </button>
                  ) : (
                    row.teacher
                  )}
                </span>
                <span>{row.mean_score}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Stream Comparison">
          <div className="max-h-48 overflow-auto">
            {streams.map((row) => (
              <div key={row.stream} className="grid grid-cols-4 border-t text-sm py-1">
                <span>{row.stream}</span>
                <span>{row.mean_score}</span>
                <span>{row.best_subject}</span>
                <span>{row.weakest_subject}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {rankingEnabled && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Top Students">
            <Ranking rows={rankingsOutliers.top_students ?? []} onSelect={setSelectedStudent} />
          </Card>
          <Card title="Bottom Students (At Risk)">
            <Ranking rows={rankingsOutliers.bottom_students ?? []} onSelect={setSelectedStudent} />
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Outlier Detection">
          <p className="font-semibold text-sm">Top Improvers</p>
          {(rankingsOutliers.improvers ?? []).map((r) => <p key={`i-${r.student_id}`} className="text-sm">Student #{r.student_id}: +{r.change}</p>)}
          <p className="font-semibold text-sm mt-3">Biggest Drops</p>
          {(rankingsOutliers.drops ?? []).map((r) => <p key={`d-${r.student_id}`} className="text-sm">Student #{r.student_id}: {r.change}</p>)}
          <p className="font-semibold text-sm mt-3">Failing</p>
          {(rankingsOutliers.failing ?? []).map((r) => <p key={`f-${r.student_id}`} className="text-sm">Student #{r.student_id}: {r.mean_score}</p>)}
        </Card>
        <Card title="Student Drill-Down">
          {!studentDetail ? (
            <p className="text-sm text-gray-600">Click a student from ranking to load backend drill-down.</p>
          ) : (
            <div className="text-sm space-y-1">
              <p>Overall mean: <strong>{studentDetail.overall_mean}</strong></p>
              <p>Strengths: {studentDetail.strengths?.join(", ") || "-"}</p>
              <p>Weaknesses: {studentDetail.weaknesses?.join(", ") || "-"}</p>
              {studentDetail.subject_scores?.map((s) => (
                <p key={s.subject}>{s.subject}: {s.mean_score}</p>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Teacher Drill-Down">
        {!teacherDetail ? (
          <p className="text-sm text-gray-600">Click a teacher name in Teacher Subject Insights to view real-name profile and rankings.</p>
        ) : (
          <div className="text-sm space-y-1">
            <p>Name: <strong>{teacherDetail.teacher_name}</strong></p>
            <p>Subject: <strong>{teacherDetail.subject}</strong></p>
            <p>Overall mean: <strong>{teacherDetail.overall_mean_score}</strong></p>
            <p>Forms taught: {teacherDetail.forms_taught?.join(", ") || "-"}</p>
            <p>
              Teacher rank: <strong>{teacherDetail.teacher_rank ?? "-"}</strong> / {teacherDetail.teachers_compared ?? 0}
            </p>
            <p>KCSE As last year (Form 4): <strong>{teacherDetail.kcse_a_count_last_year ?? 0}</strong></p>
            <div className="pt-2">
              <p className="font-semibold">Performance by Form</p>
              {(teacherDetail.form_performance ?? []).map((row) => (
                <p key={`f-${row.form}`}>Form {row.form}: {row.mean_score} ({row.records} records)</p>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function FilterSelect({ value, onChange, options, placeholder, labelPrefix = "" }) {
  return (
    <select className="border p-2 rounded" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {labelPrefix}
          {o}
        </option>
      ))}
    </select>
  );
}

function Metric({ title, value }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-elimuGreen">{value}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Ranking({ rows, onSelect }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50">
          <th className="p-2 text-left">Rank</th>
          <th className="p-2 text-left">Student</th>
          <th className="p-2 text-left">Mean</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.student_id} className="border-t">
            <td className="p-2">{r.rank}</td>
            <td className="p-2">
              <button type="button" className="text-blue-700 hover:underline" onClick={() => onSelect(r.student_id)}>
                #{r.student_id}
              </button>
            </td>
            <td className="p-2">{r.mean_score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
