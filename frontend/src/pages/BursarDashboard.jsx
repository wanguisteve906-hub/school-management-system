import { useEffect, useMemo, useState } from "react";

import { feesApi } from "../api";

export default function BursarDashboard() {
  const [defaulters, setDefaulters] = useState([]);
  const [clearance, setClearance] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [messageText, setMessageText] = useState("Dear Parent/Guardian, please clear outstanding school fees as soon as possible.");
  const [pocketAmount, setPocketAmount] = useState("");
  const [pocketType, setPocketType] = useState("deposit");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadData = () => {
    Promise.all([feesApi.listDefaulters(), feesApi.listClearanceStatus()])
      .then(([defRes, clrRes]) => {
        setDefaulters(defRes.data || []);
        setClearance(clrRes.data || []);
      })
      .catch(() => setError("Failed to load finance records"));
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedDefaulter = useMemo(
    () => defaulters.find((d) => String(d.student_id) === String(studentId)),
    [defaulters, studentId]
  );

  const sendMessage = async () => {
    if (!studentId) return;
    setError("");
    setFeedback("");
    try {
      await feesApi.sendDefaulterMessage(studentId, messageText);
      setFeedback("Parent fee reminder queued successfully.");
    } catch {
      setError("Failed to send parent fee message");
    }
  };

  const recordPocket = async () => {
    if (!studentId || !pocketAmount) return;
    setError("");
    setFeedback("");
    try {
      await feesApi.recordPocketMoney(studentId, {
        amount: Number(pocketAmount),
        transaction_type: pocketType,
        note: "Recorded from bursar dashboard",
      });
      setPocketAmount("");
      setFeedback("Pocket money transaction recorded.");
    } catch {
      setError("Failed to record pocket money transaction");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-elimuGreen">Bursar / Finance Dashboard</h2>
        <p className="text-sm text-gray-600">Manage fee defaulters, clearance status, and student pocket money.</p>
      </div>

      <div className="bg-white rounded shadow p-4 space-y-3">
        <h3 className="text-lg font-semibold">Defaulter Action Center</h3>
        <select className="border rounded px-3 py-2 w-full" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">Select defaulter</option>
          {defaulters.map((d) => (
            <option key={d.student_id} value={d.student_id}>
              {d.student_name} - KES {d.balance.toLocaleString()}
            </option>
          ))}
        </select>
        {selectedDefaulter && (
          <p className="text-sm text-gray-700">
            Outstanding: <strong>KES {selectedDefaulter.balance.toLocaleString()}</strong>
          </p>
        )}
        <textarea
          className="border rounded p-2 w-full"
          rows={3}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        <button type="button" className="bg-elimuGreen text-white rounded px-4 py-2" onClick={sendMessage}>
          Send Fee Reminder to Parent
        </button>
      </div>

      <div className="bg-white rounded shadow p-4 space-y-3">
        <h3 className="text-lg font-semibold">Pocket Money</h3>
        <div className="grid sm:grid-cols-3 gap-2">
          <input
            className="border rounded px-3 py-2"
            type="number"
            min="1"
            placeholder="Amount"
            value={pocketAmount}
            onChange={(e) => setPocketAmount(e.target.value)}
          />
          <select className="border rounded px-3 py-2" value={pocketType} onChange={(e) => setPocketType(e.target.value)}>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
          <button type="button" onClick={recordPocket} className="bg-blue-600 text-white rounded px-4 py-2">
            Record Transaction
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {feedback && <p className="text-sm text-green-700">{feedback}</p>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <div className="p-3 border-b">
          <h3 className="text-lg font-semibold">Fee Clearance Status</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Student</th>
              <th className="p-2 text-left">Fee</th>
              <th className="p-2 text-center">Owed</th>
              <th className="p-2 text-center">Paid</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {clearance.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.student_name}</td>
                <td className="p-2">{row.fee_name}</td>
                <td className="p-2 text-center">{row.amount_owed}</td>
                <td className="p-2 text-center">{row.amount_paid}</td>
                <td className="p-2 text-center">{row.status}</td>
              </tr>
            ))}
            {clearance.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-500">
                  No fee assignments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
