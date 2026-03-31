import { Link, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Staff from "./pages/Staff";
import Grades from "./pages/Grades";
import Budget from "./pages/Budget";
import Inventory from "./pages/Inventory";
import { authApi } from "./api/client";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/students", label: "Students" },
  { path: "/staff", label: "Staff" },
  { path: "/grades", label: "Grades" },
  { path: "/budget", label: "Budget" },
  { path: "/inventory", label: "Inventory" }
];

export default function App() {
  const location = useLocation();
  const [username, setUsername] = useState("TSC001");
  const [password, setPassword] = useState("TSC001");
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState(localStorage.getItem("elimu_token"));

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem("elimu_token", res.data.access_token);
      setToken(res.data.access_token);
      setAuthError("");
    } catch {
      setAuthError("Invalid credentials");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <form onSubmit={login} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-3">
          <h2 className="text-xl font-semibold text-elimuGreen">Elimu HMS Login</h2>
          <input className="border rounded w-full p-2" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" className="border rounded w-full p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          {authError && <p className="text-red-600 text-sm">{authError}</p>}
          <button className="bg-elimuGreen text-white rounded px-4 py-2 w-full">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-elimuGreen text-white p-4">
          <h1 className="text-2xl font-bold mb-8">Elimu HMS</h1>
          <nav className="space-y-2">
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
        </aside>

        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
