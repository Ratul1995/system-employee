import axios from "axios";
import { useState, useEffect } from "react";
import { Users, UserCheck, Building2, DollarSign, TrendingUp, Clock, CheckCircle2, AlertTriangle, CalendarX, Target } from "lucide-react";
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
  LineChart,
  Line,
} from "recharts";

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";

interface UserData {
  id: number;
  gender: string;
  company?: {
    department: string;
  };
  salary?: number;
}

export function ProgressWithLabel() {
  return (
    <Progress value={56} className="w-full max-w-sm">
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>
  );
}

const CardData = () => {
  const [list, setList] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State for smooth gauge animation on page mount / refresh
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("https://dummyjson.com/users?limit=200");

        const usersWithSalary = (res.data.users || []).map((u: any) => ({
          ...u,
          salary: u.salary || 30000 + ((u.id * 350) % 50000),
        }));

        setList(usersWithSalary);
      } catch (err) {
        setError("Sorry, API cannot fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 1. CARD CALCULATIONS ---
  const totalEmployees = list.length;
  const activeEmployees = Math.round(totalEmployees * 0.88);
  const totalDepartments = new Set(
    list.map((v) => v.company?.department).filter(Boolean)
  ).size;

  const totalSalary = list.reduce((acc, curr) => acc + (curr.salary || 0), 0);
  const avgSalary = totalEmployees > 0 ? Math.round(totalSalary / totalEmployees) : 0;

  // --- 2. DEPARTMENT DATA ---
  const departmentCounts: Record<string, number> = {};
  list.forEach((u) => {
    const dept = u.company?.department || "Other";
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });

  const departmentData = Object.keys(departmentCounts).map((dept) => ({
    name: dept,
    count: departmentCounts[dept],
  }));

  // --- 3. GENDER DATA ---
  const maleCount = list.filter((u) => u.gender === "male").length;
  const femaleCount = list.filter((u) => u.gender === "female").length;
  const totalGender = maleCount + femaleCount || 1;

  const malePercent = Math.round((maleCount / totalGender) * 100);
  const femalePercent = Math.round((femaleCount / totalGender) * 100);

  const genderData = [
    { name: "Male", value: malePercent, color: "#3b82f6" },
    { name: "Female", value: femalePercent, color: "#ec4899" },
  ];

  // --- 4. SALARY OVERVIEW MONTHLY TREND DATA ---
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const salaryOverviewData = months.map((month, idx) => {
    const variation = Math.sin(idx) * 4000 + idx * 600;
    return {
      month,
      salary: Math.round(avgSalary - 4000 + variation),
    };
  });

  const colorPalette = [
    '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f59e0b',
    '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#8b5cf6',
  ];

  // --- 5. OPERATIONAL ATTENDANCE CALCULATIONS ---
  const attendanceTotal = totalEmployees || 176;
  const onTimeCount = totalEmployees ? Math.round(attendanceTotal * 0.806) : 142;
  const lateCount = totalEmployees ? Math.round(attendanceTotal * 0.102) : 18;
  const absentCount = attendanceTotal - onTimeCount - lateCount;

  const onTimePercent = Math.round((onTimeCount / attendanceTotal) * 100);
  const latePercent = Math.round((lateCount / attendanceTotal) * 100);
  const absentPercent = 100 - onTimePercent - latePercent;

  // --- 6. GAUGE METER DATA & CALCULATIONS ---
  const revenueCurrent = Math.round(totalSalary / 1000);
  const revenueTarget = Math.round((totalSalary * 1.35) / 1000);
  const targetGaugePercent = Math.min(Math.round((revenueCurrent / revenueTarget) * 100), 100) || 74;

  // ANIMATION TRIGGER ON DATA LOAD / REFRESH
  useEffect(() => {
    if (loading) return;

    let startTime: number | null = null;
    const duration = 1500; // 1.5 Seconds smooth transition

    const animateGauge = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easeOutCubic curve formula
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedPercent(Math.round(easeOutProgress * targetGaugePercent));

      if (progress < 1) {
        requestAnimationFrame(animateGauge);
      }
    };

    requestAnimationFrame(animateGauge);
  }, [loading, targetGaugePercent]);

  // Dynamic Gauge Data updated during animation frame loop
  const gaugeData = [
    { name: "Achieved", value: animatedPercent, fill: "#22c55e" },
    { name: "Remaining", value: Math.max(100 - animatedPercent, 0), fill: "#1e293b" },
  ];

  // --- UPDATED NEEDLE POINTER CALCULATION (SLIGHTLY DOWN & CUSTOM COLOR) ---
  const renderArcEndpointNeedle = (value: number, cx: number, cy: number, iR: number, oR: number) => {
    const RADIAN = Math.PI / 180;
    const angle = 180 - (value / 100) * 180;

    const midRadius = (iR + oR) / 2;

    // Shift the starting point slightly inward (-5px) to move the needle down into the arc
    const startRadius = midRadius - 5;
    const needleLength = 18;

    const arcX = cx + startRadius * Math.cos(-RADIAN * angle);
    const arcY = cy + startRadius * Math.sin(-RADIAN * angle);

    const endX = cx + (startRadius + needleLength) * Math.cos(-RADIAN * angle);
    const endY = cy + (startRadius + needleLength) * Math.sin(-RADIAN * angle);

    return (
      <g className="transition-all duration-75 ease-linear">
        {/* Outer Line / Needle Main Body */}
        <line
          x1={arcX}
          y1={arcY}
          x2={endX}
          y2={endY}
          stroke="#10b981" // Emerald Green main color (change hex value to your choice)
          strokeWidth={4.5}
          strokeLinecap="round"
        />
        {/* Inner Highlight Accent Line */}
        <line
          x1={arcX}
          y1={arcY}
          x2={endX}
          y2={endY}
          stroke="#064e3b" // Dark Emerald accent line
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
    );
  };

  if (loading) {
    return <div className="text-slate-500 dark:text-slate-400 p-6">Loading metrics...</div>;
  }

  if (error) {
    return <div className="text-rose-500 p-6">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">

      {/* ================= CARDS SECTION ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Employees */}
        <div className="bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-5 rounded-xl flex items-center justify-between shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400 dark:hover:border-blue-500/50 active:scale-[0.98] cursor-pointer group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">Total Employees</p>
            <h3 className="text-2xl font-bold">{totalEmployees}</h3>
            <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +12% <span className="text-slate-400 dark:text-slate-500 ml-1">vs. last month</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/30 transition-transform duration-300 group-hover:scale-110">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Employees */}
        <div className="bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-5 rounded-xl flex items-center justify-between shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400 dark:hover:border-blue-500/50 active:scale-[0.98] cursor-pointer group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">Active Employees</p>
            <h3 className="text-2xl font-bold">{activeEmployees}</h3>
            <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +6% <span className="text-slate-400 dark:text-slate-500 ml-1">vs. last month</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-600/20 dark:text-emerald-400 dark:border-emerald-500/30 transition-transform duration-300 group-hover:scale-110">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-5 rounded-xl flex items-center justify-between shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400 dark:hover:border-blue-500/50 active:scale-[0.98] cursor-pointer group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">Departments</p>
            <h3 className="text-2xl font-bold">{totalDepartments}</h3>
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
              0% <span className="text-slate-400 dark:text-slate-500 ml-1">vs. last month</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-600/20 dark:text-purple-400 dark:border-purple-500/30 transition-transform duration-300 group-hover:scale-110">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Avg. Salary */}
        <div className="bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-5 rounded-xl flex items-center justify-between shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400 dark:hover:border-blue-500/50 active:scale-[0.98] cursor-pointer group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">Avg. Salary</p>
            <h3 className="text-2xl font-bold">${avgSalary.toLocaleString()}</h3>
            <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +10% <span className="text-slate-400 dark:text-slate-500 ml-1">vs. last month</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-600/20 dark:text-amber-400 dark:border-amber-500/30 transition-transform duration-300 group-hover:scale-110">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ================= CHARTS ROW ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* 1. Bar Chart: Employees by Department (5 Cols) */}
        <div className="xl:col-span-5 bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-5 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4">Employees by Department</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentData.map((d) => ({
                  ...d,
                  shortName: d.name.length > 7 ? `${d.name.slice(0, 7)}...` : d.name,
                }))}
                margin={{ bottom: 25, left: -15, right: 10, top: 10 }}
              >
                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  formatter={(value: any) => [`${value} Employees`, "Count"]}
                  labelFormatter={(label: any, items: any[]) => items[0]?.payload?.name || label}
                />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {departmentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Donut Chart: Gender Distribution (3 Cols) */}
        <div className="xl:col-span-3 bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <h3 className="text-lg font-bold mb-2">Gender Distribution</h3>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs font-medium pt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Male ({malePercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
              <span>Female ({femalePercent}%)</span>
            </div>
          </div>
        </div>

        {/* 3. Line Chart: Salary Overview (4 Cols) */}
        <div className="xl:col-span-4 bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">Salary Overview</h3>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
              Trend
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salaryOverviewData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>

                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(val: number) => [`$${val.toLocaleString()}`, "Avg Salary"]}
                />
                <Line
                  type="monotone"
                  dataKey="salary"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#ec4899", strokeWidth: 2, stroke: "#ffffff" }}
                  activeDot={{ r: 6, fill: "#ec4899", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ================= ATTENDANCE + ANIMATED GAUGE METER ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Operational Attendance Section (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-6 rounded-xl shadow-sm transition-all duration-300 flex flex-col justify-between">
          
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Today's Attendance & Operational Health</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Instant status report for HR and management</p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1 rounded-full border border-emerald-500/20">
                High Efficiency ({onTimePercent}%)
              </span>
            </div>

            <div className="space-y-2 mt-4">
              <div className="w-full h-4 bg-slate-100 dark:bg-[#0b1329] rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-[#1c3866]">
                <div
                  style={{ width: `${onTimePercent}%` }}
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-500 ease-in-out relative group"
                  title={`On Time: ${onTimeCount} (${onTimePercent}%)`}
                />
                <div
                  style={{ width: `${latePercent}%` }}
                  className="bg-amber-500 h-full transition-all duration-500 ease-in-out relative group"
                  title={`Late: ${lateCount} (${latePercent}%)`}
                />
                <div
                  style={{ width: `${absentPercent}%` }}
                  className="bg-purple-500 dark:bg-purple-600 h-full rounded-r-full transition-all duration-500 ease-in-out relative group"
                  title={`On Leave / Absent: ${absentCount} (${absentPercent}%)`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            
            <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#162544]/50 border border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">On Time</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {onTimeCount} <span className="text-xs font-normal text-emerald-500 dark:text-emerald-400 ml-1">({onTimePercent}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#162544]/50 border border-slate-100 dark:border-slate-800">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Late Arrival</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {lateCount} <span className="text-xs font-normal text-amber-500 dark:text-amber-400 ml-1">({latePercent}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#162544]/50 border border-slate-100 dark:border-slate-800">
              <CalendarX className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">On Leave / Absent</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {absentCount} <span className="text-xs font-normal text-purple-500 dark:text-purple-400 ml-1">({absentPercent}%)</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right: Animated Gauge Meter Section (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 text-slate-900 dark:bg-[#101b36] dark:border-[#1c3866] dark:text-white p-6 rounded-xl shadow-sm transition-all duration-300 flex flex-col items-center justify-between">
          
          <div className="flex items-center justify-between w-full mb-1">
            <h3 className="text-lg font-bold">Total Revenue</h3>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Target className="w-4 h-4" />
            </div>
          </div>

          {/* Dynamic Animated Gauge Container */}
          <div className="relative w-full h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="75%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  <Cell key="achieved" fill="#22c55e" />
                  <Cell key="remaining" fill="#1e293b" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* SVG Needle overlay sliding synchronously along the moving arc */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 160">
              {renderArcEndpointNeedle(animatedPercent, 100, 120, 65, 85)}
            </svg>

            {/* Live Counter Percent text */}
            <div className="absolute bottom-0 flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white transition-all">
                {animatedPercent}%
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Achieved</span>
            </div>
          </div>

          {/* Revenue Pill and Target Details */}
          <div className="w-full flex flex-col items-center space-y-2 mt-2">
            <div className="bg-emerald-500 text-white font-bold text-sm px-4 py-1 rounded-full shadow-sm">
              ${revenueCurrent.toLocaleString()}
            </div>
            
            <div className="text-center text-xs space-y-0.5 text-slate-500 dark:text-slate-400">
              <p><span className="font-semibold text-slate-700 dark:text-slate-300">Total Target:</span> ${revenueTarget.toLocaleString()}</p>
              <p><span className="font-semibold text-slate-700 dark:text-slate-300">Last 3 Months:</span> ${(revenueCurrent * 0.85).toFixed(0)}k</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CardData;