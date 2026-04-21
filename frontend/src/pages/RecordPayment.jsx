import { useEffect, useState } from "react";

import { feesApi, studentsApi } from "../api";

const paymentMethods = ["Cash", "M-Pesa", "Bank Transfer", "Cheque"];

export default function RecordPayment() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [defaulters, setDefaulters] = useState([]);
  const [balances, setBalances] = useState([]);
  const [formData, setFormData] = useState({
    student_fee_id: "",
    amount: "",
    payment_method: "Cash",
    mpesa_code: "",
    transaction_reference: "",
  });

  useEffect(() => {
    Promise.all([studentsApi.list(), feesApi.listDefaulters()])
      .then(([studentsRes, defaultersRes]) => {
        setStudents(studentsRes.data);
        setDefaulters(defaultersRes.data);
      })
      .catch(() => setError("Failed to load students or balances"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentFees([]);
      setFormData((p) => ({ ...p, student_fee_id: "", amount: "" }));
      return;
    }

    feesApi
      .listStudentFees(selectedStudentId)
      .then((res) => {
        const pending = res.data.filter((item) => item.balance > 0);
        setStudentFees(pending);
        setFormData((p) => ({
          ...p,
          student_fee_id: pending[0]?.id?.toString() || "",
          amount: pending[0]?.balance?.toString() || "",
        }));
      })
      .catch(() => setError("Failed to load student fee assignments"));
  }, [selectedStudentId]);

  useEffect(() => {
    if (students.length === 0) return;
    Promise.all(students.slice(0, 40).map((s) => feesApi.getBalance(s.id)))
      .then((results) => {
        setBalances(results.map((r) => r.data).filter((b) => b.balance > 0));
      })
      .catch(() => {
        // Keep page usable even if some balance calls fail.
      });
  }, [students]);

  const submitPayment = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      const res = await feesApi.recordPayment({
        ...formData,
        student_fee_id: Number(formData.student_fee_id),
        amount: Number(formData.amount),
        mpesa_code: formData.mpesa_code || null,
        transaction_reference: formData.transaction_reference || null,
      });
      setOk(`Payment recorded. Receipt: ${res.data.receipt_number}`);
      setFormData({
        student_fee_id: "",
        amount: "",
        payment_method: "Cash",
        mpesa_code: "",
        transaction_reference: "",
      });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to record payment");
    }
  };

  if (loading) return <div className="animate-pulse text-elimuGreen">Loading payment form...</div>;
  const selectedFee = studentFees.find((fee) => String(fee.id) === formData.student_fee_id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-elimuGreen">Record Payment</h2>
      <p className="text-sm text-gray-600">
        Choose a student and fee item to pay. Receipt numbers are auto-generated as `RCP-XXXXXXXX`.
      </p>

      <form onSubmit={submitPayment} className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          className="border rounded px-3 py-2"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          required
        >
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name} ({s.admission_no})
            </option>
          ))}
        </select>
        <select
          className="border rounded px-3 py-2"
          value={formData.student_fee_id}
          onChange={(e) => {
            const feeId = e.target.value;
            const fee = studentFees.find((f) => String(f.id) === feeId);
            setFormData((p) => ({ ...p, student_fee_id: feeId, amount: fee?.balance?.toString() || "" }));
          }}
          required
          disabled={!selectedStudentId || studentFees.length === 0}
        >
          <option value="">{selectedStudentId ? "Select fee item" : "Select student first"}</option>
          {studentFees.map((fee) => (
            <option key={fee.id} value={fee.id}>
              {fee.fee_name} - Term {fee.term}/{fee.year} - Balance KES {fee.balance.toLocaleString()}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="border rounded px-3 py-2"
          placeholder={selectedFee ? `Amount (max KES ${selectedFee.balance.toLocaleString()})` : "Amount (KES)"}
          value={formData.amount}
          onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
          max={selectedFee?.balance || undefined}
          required
        />
        <select
          className="border rounded px-3 py-2"
          value={formData.payment_method}
          onChange={(e) => setFormData((p) => ({ ...p, payment_method: e.target.value }))}
        >
          {paymentMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          className="border rounded px-3 py-2"
          placeholder="M-Pesa code (required for M-Pesa)"
          value={formData.mpesa_code}
          onChange={(e) => setFormData((p) => ({ ...p, mpesa_code: e.target.value }))}
        />
        <input
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="Transaction reference (optional)"
          value={formData.transaction_reference}
          onChange={(e) => setFormData((p) => ({ ...p, transaction_reference: e.target.value }))}
        />
        <div className="md:col-span-2">
          <button type="submit" className="bg-elimuGreen text-white rounded px-4 py-2">
            Record Payment
          </button>
        </div>
      </form>
      {selectedFee && (
        <p className="text-sm text-gray-700">
          Selected balance: <strong>KES {selectedFee.balance.toLocaleString()}</strong> (Owed: KES{" "}
          {selectedFee.amount_owed.toLocaleString()}, Paid: KES {selectedFee.amount_paid.toLocaleString()})
        </p>
      )}

      {ok && <p className="text-green-700">{ok}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Students with balances</h3>
          <ul className="text-sm space-y-1 max-h-60 overflow-auto">
            {balances.map((b) => (
              <li key={b.student_id} className="border-b pb-1">
                {b.student_name}: <strong>KES {b.balance.toLocaleString()}</strong>
              </li>
            ))}
            {balances.length === 0 && <li className="text-gray-500">No outstanding balances in sampled students</li>}
          </ul>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Defaulters</h3>
          <ul className="text-sm space-y-1 max-h-60 overflow-auto">
            {defaulters.map((d) => (
              <li key={d.student_id} className="border-b pb-1">
                {d.student_name}: <strong>KES {d.balance.toLocaleString()}</strong>
              </li>
            ))}
            {defaulters.length === 0 && <li className="text-gray-500">No defaulters found</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
