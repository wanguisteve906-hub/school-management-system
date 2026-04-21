import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Calendar,
  Bell,
  Plus,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";

import { budgetApi, gradesApi, staffApi, studentsApi } from "../api";

const colors = {
  primary: "#1a6b3c",
  secondary: "#2f855a",
  accent: "#48bb78",
  warning: "#d69e2e",
  danger: "#e53e3e",
  info: "#3182ce",
  gray: "#718096",
};

const chartColors = ["#1a6b3c", "#2f855a", "#48bb78", "#68d391", "#9ae6b4", "#c6f6d5"];

// Mock data for demonstration - will be replaced with real data
const mockAlerts = [
  { id: 1, type: "warning", message: "23 students have fee balances > KES 10,000", time: "2 hours ago" },
  { id: 2, type: "danger", message: "Form 3B attendance below 75% today", time: "30 minutes ago" },
  { id: 3, type: "info", message: "3 exam results pending approval", time: "1 hour ago" },
  { id: 4, type: "success", message: "Fee collection target exceeded for March", time: "3 hours ago" },
];

const mockRecentActivity = [
  { id: 1, user: "John Doe", action: "marked attendance for", target: "Form 2B", time: "5 min ago" },
  { id: 2, user: "Jane Smith", action: "recorded fee payment of", target: "KES 15,000", time: "12 min ago" },
  { id: 3, user: "Michael Kamau", action: "enrolled new student", target: "Sarah Wanjiku", time: "1 hour ago" },
  { id: 4, user: "Alice Njoroge", action: "approved", target: "Form 4 exam results", time: "2 hours ago" },
  { id: 5, user: "Peter Ochieng", action: "updated", target: "staff timetable", time: "3 hours ago" },
];

const mockFeeTrend = [
  { month: "Jan", collected: 320000, target: 350000 },
  { month: "Feb", collected: 380000, target: 350000 },
  { month: "Mar", collected: 420000, target: 400000 },
  { month: "Apr", collected: 390000, target: 400000 },
  { month: "May", collected: 450000, target: 420000 },
  { month: "Jun", collected: 410000, target: 420000 },
];

const KPICard = ({ title, value, trend, trendValue, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    {trend && (
      <div className="flex items-center mt-4">
        {trend === "up" ? (
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
        )}
        <span className={`text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
          {trendValue}
        </span>
        <span className="text-sm text-gray-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
);

const AlertItem = ({ type, message, time }) => {
  const styles = {
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    danger: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  const icons = {
    warning: AlertCircle,
    danger: AlertCircle,
    info: Bell,
    success: CheckCircle,
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${styles[type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs opacity-75 mt-1">{time}</p>
      </div>
    </div>
  );
};

const QuickActionButton = ({ icon: Icon, label, onClick, color = "elimuGreen" }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-elimuGreen hover:shadow-md transition-all group"
  >
    <div className={`p-3 rounded-full bg-${color}-100 group-hover:bg-elimuGreen transition-colors mb-2`}>
      <Icon className="w-5 h-5 text-elimuGreen group-hover:text-white" />
    </div>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </button>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({ students: 0, staff: 0 });
  const [performance, setPerformance] = useState([]);
  const [budget, setBudget] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      studentsApi.list(),
      staffApi.list(),
      gradesApi.classPerformance(),
      budgetApi.list(),
    ])
      .then(([studentsRes, staffRes, perfRes, budgetRes]) => {
        setMetrics({
          students: studentsRes.data.length,
          staff: staffRes.data.length,
        });
        setPerformance(perfRes.data.data || []);
        setBudget(budgetRes.data);
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 border-4 border-elimuGreen border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-elimuGreen font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-elimuGreen text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = currentTime.toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Principal Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Term 2, 2025
          </span>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Students"
          value={metrics.students.toLocaleString()}
          trend="up"
          trendValue="+12"
          icon={Users}
          color="bg-elimuGreen"
          subtitle="Across all forms"
        />
        <KPICard
          title="Today's Attendance"
          value="94.2%"
          trend="down"
          trendValue="-1.3%"
          icon={UserCheck}
          color="bg-blue-600"
          subtitle="Form 3B needs attention"
        />
        <KPICard
          title="Fee Collection"
          value="KES 450K"
          trend="up"
          trendValue="+8.5%"
          icon={DollarSign}
          color="bg-green-600"
          subtitle="Monthly target: KES 420K"
        />
        <KPICard
          title="Staff on Duty"
          value={`42/45`}
          trend="up"
          trendValue="93%"
          icon={Users}
          color="bg-purple-600"
          subtitle="3 on leave today"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickActionButton icon={Plus} label="Add Student" />
              <QuickActionButton icon={DollarSign} label="Record Payment" />
              <QuickActionButton icon={CheckCircle} label="Mark Attendance" />
              <QuickActionButton icon={FileText} label="Send Announcement" />
            </div>
          </div>

          {/* Fee Collection Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Fee Collection Trend</h3>
              <button className="text-sm text-elimuGreen hover:underline">View Report</button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockFeeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#718096" fontSize={12} />
                  <YAxis stroke="#718096" fontSize={12} tickFormatter={(v) => `KES ${v / 1000}K`} />
                  <Tooltip
                    formatter={(value) => `KES ${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="collected"
                    stroke={colors.primary}
                    strokeWidth={3}
                    dot={{ fill: colors.primary, strokeWidth: 2 }}
                    name="Collected"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke={colors.gray}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target"
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Performance by Form</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performance}>
                    <XAxis dataKey="stream" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Mean Score"]}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    />
                    <Bar dataKey="mean_score" fill={colors.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Allocation</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budget}
                      dataKey="allocated_amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {budget.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `KES ${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alerts
              </h3>
              <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                {mockAlerts.length} new
              </span>
            </div>
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <AlertItem key={alert.id} {...alert} />
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-elimuGreen hover:bg-green-50 rounded-lg transition-colors">
              View All Alerts
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-elimuGreen/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-elimuGreen">
                      {activity.user.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-gray-500">{activity.action}</span>{" "}
                      <span className="font-medium text-gray-700">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-elimuGreen hover:bg-green-50 rounded-lg transition-colors">
              View All Activity
            </button>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Schedule
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="text-center min-w-[3rem]">
                  <span className="text-xs text-gray-500">NOW</span>
                  <p className="text-sm font-semibold text-gray-900">08:00</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Mathematics</p>
                  <p className="text-sm text-gray-500">Form 3A • Room 4B</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center min-w-[3rem]">
                  <span className="text-xs text-gray-500">UPCOMING</span>
                  <p className="text-sm font-semibold text-gray-900">10:00</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Chemistry Exam</p>
                  <p className="text-sm text-gray-500">Form 4 • Lab 2</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center min-w-[3rem]">
                  <p className="text-sm font-semibold text-gray-900">14:00</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Staff Meeting</p>
                  <p className="text-sm text-gray-500">Conference Room</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
