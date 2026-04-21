import { Link, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Staff from "./pages/Staff";
import Grades from "./pages/Grades";
import Budget from "./pages/Budget";
import Inventory from "./pages/Inventory";
import FeeStructures from "./pages/FeeStructures";
import RecordPayment from "./pages/RecordPayment";
import FeeBalances from "./pages/FeeBalances";
import { authApi } from "./api/client";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/students", label: "Students" },
  { path: "/staff", label: "Staff" },
  { path: "/grades", label: "Grades" },
  { path: "/budget", label: "Budget" },
  { path: "/inventory", label: "Inventory" },
  { path: "/fees/structures", label: "Fee Structures" },
  { path: "/fees/payments", label: "Record Payment" },
  { path: "/fees/balances", label: "Fee Balances" }
];

export default function App() {
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tscNumber, setTscNumber] = useState("");
  const [password, setPassword] = useState("");
  const [nameForLogin, setNameForLogin] = useState("");
  const [authError, setAuthError] = useState("");
  const [authOk, setAuthOk] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("elimu_token"));

  const parseApiError = (err) => {
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      return "Cannot reach API. Is the backend running on port 8000?";
    }
    const msg = err.response?.data?.error || err.response?.data?.detail;
    return typeof msg === "string" ? msg : "Something went wrong";
  };

  const signup = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthOk("");
    setLoginLoading(true);
    try {
      await authApi.signup(firstName.trim(), lastName.trim(), tscNumber.trim());
      setAuthOk("Account created. Sign in below.");
      setMode("login");
      setPassword("");
      setNameForLogin("");
    } catch (err) {
      setAuthError(parseApiError(err));
    } finally {
      setLoginLoading(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthOk("");
    setLoginLoading(true);
    try {
      const res = await authApi.login(tscNumber.trim(), password, nameForLogin.trim());
      localStorage.setItem("elimu_token", res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError(parseApiError(err));
      } else {
        setAuthError(parseApiError(err));
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("elimu_token");
    setToken(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4">
          <div className="flex gap-2 border-b pb-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setAuthError("");
                setAuthOk("");
              }}
              className={`flex-1 py-2 rounded ${mode === "login" ? "bg-elimuGreen text-white" : "bg-gray-100"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setAuthError("");
                setAuthOk("");
              }}
              className={`flex-1 py-2 rounded ${mode === "signup" ? "bg-elimuGreen text-white" : "bg-gray-100"}`}
            >
              Sign up
            </button>
          </div>

          {mode === "signup" ? (
            <form onSubmit={signup} className="space-y-3">
              <h2 className="text-xl font-semibold text-elimuGreen">Create account</h2>
              <p className="text-sm text-gray-600">
                TSC number is your username. Your password for sign-in will be your TSC number (you will enter it on the
                sign-in form).
              </p>
              <input
                className="border rounded w-full p-2"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
                autoComplete="given-name"
              />
              <input
                className="border rounded w-full p-2"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
                autoComplete="family-name"
              />
              <input
                className="border rounded w-full p-2"
                value={tscNumber}
                onChange={(e) => setTscNumber(e.target.value)}
                placeholder="TSC number (username)"
                required
                autoComplete="username"
              />
              {authError && <p className="text-red-600 text-sm">{authError}</p>}
              {authOk && <p className="text-green-700 text-sm">{authOk}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="bg-elimuGreen text-white rounded px-4 py-2 w-full disabled:opacity-60"
              >
                {loginLoading ? "Creating…" : "Sign up"}
              </button>
            </form>
          ) : (
            <form onSubmit={login} className="space-y-3">
              <h2 className="text-xl font-semibold text-elimuGreen">Sign in</h2>
              <p className="text-sm text-gray-600">
                Password must be your TSC number. Enter your <strong>first name</strong> or <strong>last name</strong> as
                it appears on your account.
              </p>
              <input
                className="border rounded w-full p-2"
                value={tscNumber}
                onChange={(e) => setTscNumber(e.target.value)}
                placeholder="TSC number"
                required
                autoComplete="username"
              />
              <input
                type="password"
                className="border rounded w-full p-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (your TSC number)"
                required
                autoComplete="current-password"
              />
              <input
                className="border rounded w-full p-2"
                value={nameForLogin}
                onChange={(e) => setNameForLogin(e.target.value)}
                placeholder="First name or last name"
                required
                autoComplete="name"
              />
              {authError && <p className="text-red-600 text-sm">{authError}</p>}
              {authOk && <p className="text-green-700 text-sm">{authOk}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="bg-elimuGreen text-white rounded px-4 py-2 w-full disabled:opacity-60"
              >
                {loginLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-elimuGreen text-white p-4 flex flex-col">
          <h1 className="text-2xl font-bold mb-8">Elimu HMS</h1>
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block rounded px-3 py-2 ${
                  location.pathname === item.path ? "bg-white text-elimuGreen font-semibold" : "hover:bg-green-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="mt-4 rounded px-3 py-2 text-left border border-white/40 hover:bg-green-800"
          >
            Log out
          </button>
        </aside>

        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/fees/structures" element={<FeeStructures />} />
            <Route path="/fees/payments" element={<RecordPayment />} />
            <Route path="/fees/balances" element={<FeeBalances />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
