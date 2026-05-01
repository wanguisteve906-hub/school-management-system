import { useEffect, useMemo, useState } from "react";

import { classTeacherApi } from "../api";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ClassTeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([classTeacherApi.classStudents(), classTeacherApi.attendance(date)])
      .then(([studentsRes, attendanceRes]) => {
        const studentRows = studentsRes.data || [];
        const attendanceMap = {};
        (attendanceRes.data || []).forEach((row) => {
          attendanceMap[row.student_id] = row.status;
        });
        setStudents(studentRows);
        setAttendance(attendanceMap);
      })
      .catch(() => setError("Failed to load class records"))
      .finally(() => setLoading(false));
  }, [date]);

  const stats = useMemo(() => {
    const values = Object.values(attendance);
    const present = values.filter((v) => v === "present").length;
    const absent = values.filter((v) => v === "absent").length;
    const late = values.filter((v) => v === "late").length;
    return { present, absent, late };
  }, [attendance]);

  const saveAttendance = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await classTeacherApi.updateAttendance({
        date,
        records: students.map((s) => ({
          student_id: s.id,
          status: attendance[s.id] || "present",
        })),
      });
      setMessage("Attendance updated successfully.");
    } catch {
      setError("Failed to update attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading class dashboard...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-elimuGreen">Class Teacher Dashboard</h2>
          <p className="text-sm text-gray-600">Manage your class records and attendance only.</p>
        </div>
        <input type="date" className="border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Present</p>
          <p className="text-xl font-bold text-green-700">{stats.present}</p>
        </div>
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Late</p>
          <p className="text-xl font-bold text-amber-700">{stats.late}</p>
        </div>
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Absent</p>
          <p className="text-xl font-bold text-red-700">{stats.absent}</p>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Student</th>
              <th className="p-2 text-left">Admission No</th>
              <th className="p-2 text-left">Guardian</th>
              <th className="p-2 text-left">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{`${s.first_name} ${s.last_name}`}</td>
                <td className="p-2">{s.admission_no}</td>
                <td className="p-2">{s.guardian_name || "-"}</td>
                <td className="p-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={attendance[s.id] || "present"}
                    onChange={(e) => setAttendance((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <button
        type="button"
        onClick={saveAttendance}
        disabled={saving}
        className="bg-elimuGreen text-white rounded px-4 py-2 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Attendance"}
      </button>
    </div>
  );
}
