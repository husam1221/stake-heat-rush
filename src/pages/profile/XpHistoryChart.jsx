// src/pages/profile/XpHistoryChart.jsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchXpHistory } from "../../lib/xpApi.js";

const sourceLabels = {
  daily_tank: "Daily Tank",
  task: "Tasks",
  referral_qualified: "Qualified Referrals",
  referral_milestone: "Referral Milestones",
};

const XpHistoryChart = ({ wallet }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!wallet) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetchXpHistory(wallet, 30)
      .then((res) => {
        const items = res?.items || [];
        const days = res?.days || 30;

        // نحط النتائج في map حسب التاريخ الكامل "YYYY-MM-DD"
        const byDate = {};
        items.forEach((d) => {
          if (d.date) {
            byDate[d.date] = d;
          }
        });

        const chartData = [];
        const now = new Date();

        // نبني آخر N أيام بالترتيب من الأقدم للأحدث
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);

          const fullDay = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
          const label = fullDay.slice(5); // "MM-DD" على الـ X

          const row = byDate[fullDay];

          let totalPoints = row ? row.totalPoints : 0;
          let totalXp = row ? row.totalXp : 0;
          const sources = row ? row.sources || [] : [];

          // قيم للعرض في الجراف (حتى لو صفر نخلي بار صغير)
          let pointsBar = totalPoints;
          let xpBar = totalXp;

          if (totalPoints === 0 && totalXp === 0) {
            pointsBar = 0.01; // عمود صغير شكلي
            xpBar = 0;        // نخلي XP صفر بصرياً
          }

          chartData.push({
            date: label,      // اللي يطلع على المحور X
            fullDate: fullDay, // اللي يطلع في التولتيب
            totalPoints,
            totalXp,
            pointsBar,
            xpBar,
            sources,
          });
        }

        setData(chartData);
      })
      .catch((err) => {
        console.error("Failed to load XP history:", err);
        setError("Failed to load XP history");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [wallet]);

  if (!wallet) {
    return <p className="xp-history-note">Connect wallet to see XP history.</p>;
  }

  if (loading) {
    return <p className="xp-history-note">Loading XP history…</p>;
  }

  if (error) {
    return <p className="xp-history-note error">{error}</p>;
  }

  if (!data.length) {
    return (
      <p className="xp-history-note">
        No points or XP recorded in the last 30 days.
      </p>
    );
  }

  // Tooltip مخصص
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0].payload;

    return (
      <div className="xp-history-tooltip">
        <div className="xp-history-tooltip-header">
          <strong>{row.fullDate || label}</strong>
        </div>
        <div className="xp-history-tooltip-total">
          Total: <strong>{row.totalPoints}</strong> pts /{" "}
          <strong>{row.totalXp}</strong> XP
        </div>
        <div className="xp-history-tooltip-sources-title">Breakdown:</div>
        <ul className="xp-history-tooltip-list">
          {row.sources.map((s, idx) => (
            <li key={idx}>
              <span className="xp-history-tooltip-source-name">
                {sourceLabels[s.source] || s.source}
              </span>
              : +{s.points} pts / +{s.xp} XP
            </li>
          ))}
        </ul>
      </div>
    );
  };





return (
  <div className="xp-history-chart-wrapper">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />

          <defs>
            <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffb9a" />
              <stop offset="40%" stopColor="#ffb347" />
              <stop offset="100%" stopColor="#ff7b00" />
            </linearGradient>
            <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tick={{ fill: "#e5e7eb", fontSize: 11 }}
            tickMargin={6}
          />
          <YAxis
            tick={{ fill: "#e5e7eb", fontSize: 11 }}
            tickMargin={6}
          />

          {/* هنا شيلنا الخط الأبيض تبع الهوفر */}
          <Tooltip content={<CustomTooltip />} cursor={false} />

          {/* نرسم الأعمدة بناءً على قيم bar (مش القيم الفعلية) */}
          <Bar
            dataKey="pointsBar"
            name="Points"
            fill="url(#pointsGradient)"
            radius={[6, 6, 0, 0]}
            barSize={14}
          />
          <Bar
            dataKey="xpBar"
            name="XP"
            fill="url(#xpGradient)"
            radius={[6, 6, 0, 0]}
            barSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>




  );
};

export default XpHistoryChart;
