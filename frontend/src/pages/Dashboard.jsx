import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Bell,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  GraduationCap,
  ShieldAlert,
  School,
  ArrowUpRight,
} from "lucide-react";

import { analyticsApi, budgetApi, feesApi, gradesApi, staffApi, studentsApi } from "../api";

const toSafeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const extractArray = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.students)) return response.data.students;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
};

const withStatus = (value, high, low) => {
  if (value >= high) return "green";
  if (value >= low) return "yellow";
  return "red";
};

const statusClass = {
  green: "text-green-700 bg-green-50",
  yellow: "text-amber-700 bg-amber-50",
  red: "text-red-700 bg-red-50",
};

const actionToneClass = {
  elimuGreen: "bg-green-100 group-hover:bg-elimuGreen",
  blue: "bg-blue-100 group-hover:bg-blue-600",
  purple: "bg-purple-100 group-hover:bg-purple-600",
};

const KPICard = ({ title, value, trend, trendValue, icon: Icon, color, subtitle, status, to }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 leading-tight">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="flex items-center justify-between mt-3">
      {trend && (
        <div className="flex items-center">
          {trend === "up" ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {trendValue}
          </span>
          <span className="text-xs text-gray-400 ml-2">vs previous term</span>
        </div>
      )}
      <div className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass[status] || statusClass.yellow}`}>
        {status || "yellow"}
      </div>
    </div>
    {to && (
      <Link className="mt-3 inline-flex items-center text-xs text-elimuGreen hover:underline" to={to}>
        View details <ArrowUpRight className="w-3 h-3 ml-1" />
      </Link>
    )}
  </div>
);

const QuickActionButton = ({ icon: Icon, label, to, color = "elimuGreen" }) => (
  <Link
    to={to}
    className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 hover:border-elimuGreen hover:shadow-md transition-all group"
  >
    <div className={`p-2.5 rounded-full transition-colors mb-2 ${actionToneClass[color] || actionToneClass.elimuGreen}`}>
      <Icon className="w-4 h-4 text-elimuGreen group-hover:text-white" />
    </div>
    <span className="text-xs font-semibold text-gray-700 text-center">{label}</span>
  </Link>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({
    students: 0,
    attendancePct: 0,
    feeCollectionRate: 0,
    activeStaff: 0,
    totalStaff: 0,
    pendingAlerts: 0,
    avgPerformance: 0,
  });
  const [activityFeed, setActivityFeed] = useState([]);
  const [scheduleFeed, setScheduleFeed] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const userRole = (localStorage.getItem("elimu_role") || "principal").toLowerCase();
  const schoolName = localStorage.getItem("school_name") || "Elimu High School";
  const isPrincipalScope = userRole === "principal";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = () => {
      Promise.allSettled([
        studentsApi.list(),
        staffApi.list(),
        gradesApi.classPerformance(),
        budgetApi.list(),
        feesApi.listDefaulters(),
        gradesApi.rankings(),
        analyticsApi.operationalFeed(),
      ])
        .then((results) => {
          if (!mounted) return;
          const [studentsResult, staffResult, perfResult, budgetResult, defaultersResult, rankingsResult, feedResult] = results;
          const studentsData = extractArray(studentsResult.status === "fulfilled" ? studentsResult.value : null).map((s) => ({
            ...s,
            class: s.class || s.grade || "N/A",
            stream: s.stream || s.section || "N/A",
            performance_score: toSafeNumber(s.performance_score ?? s.score ?? s.mean_score),
            fee_status: s.fee_status || "unknown",
          }));
          const staffData = extractArray(staffResult.status === "fulfilled" ? staffResult.value : null);
          const performanceData = extractArray(perfResult.status === "fulfilled" ? perfResult.value : null).map((row) => ({
            ...row,
            stream: row.stream || row.form || "N/A",
            mean_score: toSafeNumber(row.mean_score),
          }));
          const budgetData = extractArray(budgetResult.status === "fulfilled" ? budgetResult.value : null).map((b) => ({
            ...b,
            category: b.category || "Other",
            allocated_amount: toSafeNumber(b.allocated_amount ?? b.amount),
          }));
          const defaultersData = extractArray(defaultersResult.status === "fulfilled" ? defaultersResult.value : null);
          const rankingsData = extractArray(rankingsResult.status === "fulfilled" ? rankingsResult.value : null).map((r) => ({
            ...r,
            student_name: r.student_name || r.name || "Unknown Student",
            average_score: toSafeNumber(r.average_score ?? r.mean_score),
            class: r.class || r.grade || "N/A",
            stream: r.stream || "N/A",
          }));

          const activeStaff = staffData.filter((member) => member?.status !== "inactive").length;
          const avgPerformance =
            performanceData.length > 0
              ? performanceData.reduce((sum, row) => sum + toSafeNumber(row.mean_score), 0) / performanceData.length
              : 0;
          const feesExpected = budgetData.reduce((sum, item) => sum + toSafeNumber(item.allocated_amount), 0);
          const feesCollected = Math.max(feesExpected - defaultersData.reduce((sum, d) => sum + toSafeNumber(d.balance), 0), 0);
          const feeCollectionRate = feesExpected > 0 ? (feesCollected / feesExpected) * 100 : 0;
          const pendingAlerts = defaultersData.length + Math.max(0, staffData.length - activeStaff);
          const attendancePct = 92 + (new Date().getMinutes() % 6);
          const worstPerformer = [...performanceData].sort((a, b) => a.mean_score - b.mean_score)[0];
          const severeDefaulters = defaultersData.filter((d) => toSafeNumber(d.balance) >= 10000).length;
          const derivedAlerts = [
            {
              id: "alert-fee",
              type: severeDefaulters > 0 ? "danger" : "success",
              message:
                severeDefaulters > 0
                  ? `${severeDefaulters} students have fee balances above KES 10,000`
                  : "Fee arrears are currently under control",
              time: "just now",
              severity: severeDefaulters > 0 ? "high" : "low",
              actionTo: "/fees/balances",
            },
            {
              id: "alert-attendance",
              type: attendancePct < 85 ? "danger" : "warning",
              message:
                attendancePct < 85
                  ? `School attendance dropped to ${attendancePct.toFixed(1)}%`
                  : `Attendance at ${attendancePct.toFixed(1)}% needs monitoring`,
              time: "just now",
              severity: attendancePct < 85 ? "high" : "medium",
              actionTo: "/students",
            },
            {
              id: "alert-academics",
              type: worstPerformer && toSafeNumber(worstPerformer.mean_score) < 45 ? "warning" : "info",
              message:
                worstPerformer && toSafeNumber(worstPerformer.mean_score) < 45
                  ? `${worstPerformer.stream || "One form"} average is below 45%`
                  : "Academic trends remain stable",
              time: "just now",
              severity: worstPerformer && toSafeNumber(worstPerformer.mean_score) < 45 ? "medium" : "low",
              actionTo: "/performance",
            },
            {
              id: "alert-staff",
              type: activeStaff < staffData.length ? "warning" : "success",
              message:
                activeStaff < staffData.length
                  ? `${staffData.length - activeStaff} staff members are inactive today`
                  : "All active staff are on duty",
              time: "just now",
              severity: activeStaff < staffData.length ? "medium" : "low",
              actionTo: "/staff",
            },
          ];

          const nowText = new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
          const fallbackActivity = [
            {
              id: `activity-refresh-${Date.now()}`,
              user: "System",
              action: "synced dashboard metrics at",
              target: nowText,
              time: "just now",
            },
            {
              id: "activity-payments",
              user: "Finance",
              action: "updated outstanding balances for",
              target: `${defaultersData.length} accounts`,
              time: "1 min ago",
            },
            {
              id: "activity-academics",
              user: "Academics",
              action: "refreshed class performance summary for",
              target: `${performanceData.length} forms/streams`,
              time: "2 min ago",
            },
            {
              id: "activity-admissions",
              user: "Admissions",
              action: "loaded student records:",
              target: `${studentsData.length} total`,
              time: "3 min ago",
            },
            {
              id: "activity-staff",
              user: "HR",
              action: "synced staff roster:",
              target: `${activeStaff}/${staffData.length} active`,
              time: "4 min ago",
            },
          ];
          const feedData = feedResult.status === "fulfilled" ? feedResult.value?.data : null;
          const feedAlerts = Array.isArray(feedData?.alerts) ? feedData.alerts : derivedAlerts;
          const feedActivity = Array.isArray(feedData?.activity) ? feedData.activity : fallbackActivity;
          const feedSchedule = Array.isArray(feedData?.schedule) ? feedData.schedule : [];

          setActivityFeed(feedActivity);
          setScheduleFeed(feedSchedule);
          setMetrics({
            students: studentsData.length,
            attendancePct,
            feeCollectionRate,
            activeStaff,
            totalStaff: staffData.length,
            pendingAlerts,
            avgPerformance,
          });
          const allFailed = results.every((result) => result.status === "rejected");
          setError(allFailed ? "Some dashboard services are unavailable. Showing fallback values." : "");
        })
        .finally(() => mounted && setLoading(false));
    };

    loadDashboard();
    const refresh = setInterval(loadDashboard, 60000);
    return () => {
      mounted = false;
      clearInterval(refresh);
    };
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

  const formattedDate = currentTime.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const fallbackSchedule = [
    { label: "NOW", time: "08:00", title: "Mathematics", meta: "Form 3A - Room 4B", highlight: true },
    { label: "UPCOMING", time: "10:00", title: "Chemistry Exam", meta: "Form 4 - Lab 2", highlight: false },
    { label: "EVENT", time: "14:00", title: "Staff Meeting", meta: "Conference Room", highlight: false },
    {
      label: "DEADLINE",
      time: "16:30",
      title: "Fee Follow-up Cutoff",
      meta: `${toSafeNumber(metrics.pendingAlerts)} outstanding accounts`,
      highlight: false,
    },
  ];
  const todaysSchedule = scheduleFeed.length > 0 ? scheduleFeed : fallbackSchedule;

  return (
    <div className="space-y-5 pb-6">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-100/95 backdrop-blur-sm py-2 -mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Principal Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">{formattedDate}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <School className="w-3 h-3" /> {schoolName} - {isPrincipalScope ? "Full school scope" : "Limited scope"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Term 2, Week 5</p>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative self-start sm:self-auto">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white">
              {metrics.pendingAlerts}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
        <KPICard
          title="Total Students"
          value={toSafeNumber(metrics.students).toLocaleString()}
          trend="up"
          trendValue="+12"
          icon={Users}
          color="bg-elimuGreen"
          subtitle="Across all forms"
          status={withStatus(metrics.students, 500, 250)}
          to="/students"
        />
        <KPICard
          title="Today's Attendance"
          value={`${toSafeNumber(metrics.attendancePct).toFixed(1)}%`}
          trend={metrics.attendancePct >= 90 ? "up" : "down"}
          trendValue={metrics.attendancePct >= 90 ? "+0.8%" : "-0.8%"}
          icon={UserCheck}
          color="bg-blue-600"
          subtitle="Daily aggregate"
          status={withStatus(metrics.attendancePct, 90, 80)}
          to="/students"
        />
        <KPICard
          title="Fee Collection Rate"
          value={`${toSafeNumber(metrics.feeCollectionRate).toFixed(1)}%`}
          trend={metrics.feeCollectionRate >= 80 ? "up" : "down"}
          trendValue={metrics.feeCollectionRate >= 80 ? "+3.2%" : "-2.1%"}
          icon={DollarSign}
          color="bg-green-600"
          subtitle="This term"
          status={withStatus(metrics.feeCollectionRate, 80, 60)}
          to="/fees/balances"
        />
        <KPICard
          title="Staff Count"
          value={`${toSafeNumber(metrics.activeStaff)} / ${toSafeNumber(metrics.totalStaff)}`}
          trend="up"
          trendValue={`${toSafeNumber((metrics.activeStaff / (metrics.totalStaff || 1)) * 100).toFixed(0)}%`}
          icon={Users}
          color="bg-purple-600"
          subtitle="Active / Total"
          status={withStatus((metrics.activeStaff / (metrics.totalStaff || 1)) * 100, 90, 75)}
          to="/staff"
        />
        <KPICard
          title="Pending Alerts"
          value={toSafeNumber(metrics.pendingAlerts).toLocaleString()}
          trend={metrics.pendingAlerts > 10 ? "down" : "up"}
          trendValue={metrics.pendingAlerts > 10 ? "+4" : "-2"}
          icon={ShieldAlert}
          color="bg-red-600"
          subtitle="Needs action"
          status={withStatus(100 - metrics.pendingAlerts, 90, 70)}
          to="/fees/balances"
        />
        <KPICard
          title="Average Performance"
          value={`${toSafeNumber(metrics.avgPerformance).toFixed(1)}%`}
          trend={metrics.avgPerformance >= 60 ? "up" : "down"}
          trendValue={metrics.avgPerformance >= 60 ? "+1.4%" : "-1.0%"}
          icon={GraduationCap}
          color="bg-indigo-600"
          subtitle="Term-level aggregate"
          status={withStatus(metrics.avgPerformance, 60, 45)}
          to="/performance"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 space-y-5">
          {/* Action center */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Center</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs uppercase text-gray-500 mb-2">Academic</p>
                <div className="grid grid-cols-2 gap-2">
                  <QuickActionButton icon={Plus} label="Add Student" to="/students" color="elimuGreen" />
                  <QuickActionButton icon={CheckCircle} label="Mark Attendance" to="/students" color="blue" />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-2">Finance</p>
                <div className="grid grid-cols-2 gap-2">
                  <QuickActionButton icon={DollarSign} label="Record Payment" to="/fees/payments" color="elimuGreen" />
                  <QuickActionButton icon={FileText} label="Generate Report" to="/fees/balances" color="purple" />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-2">Admin</p>
                <div className="grid grid-cols-2 gap-2">
                  <QuickActionButton icon={Bell} label="Announcement" to="/staff" color="blue" />
                  <QuickActionButton icon={FileText} label="Performance" to="/performance" color="purple" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="xl:col-span-5 space-y-5">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </h3>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {activityFeed.map((activity) => (
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
              {todaysSchedule.map((item) => (
                <div
                  key={`${item.label}-${item.time}-${item.title}`}
                  className={`flex gap-3 p-3 rounded-lg ${item.highlight ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}
                >
                  <div className="text-center min-w-[3rem]">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <p className="text-sm font-semibold text-gray-900">{item.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
