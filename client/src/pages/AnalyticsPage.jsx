import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, PieChart as PieIcon, Gauge } from 'lucide-react';

// Deep Analytics Page - Smart Police Recognition Dashboard
// Visualizes sentiment trends, recognition growth, performance distribution and KPI analytics.
// Uses dummy or API data (/kpis, /recognitions).

export default function AnalyticsPage() {
  const [kpi, setKpi] = useState({ recognition_rate: 0.12, avg_officer_score: 0.79, cases_closed_rate: 0.74, community_sentiment: 0.81 });
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get('http://localhost:8000/kpis');
        setKpi(res.data);
      } catch {
        setKpi({ recognition_rate: 0.12, avg_officer_score: 0.79, cases_closed_rate: 0.74, community_sentiment: 0.81 });
      }
      setMonthlyTrends([
        { month: 'Apr', recognitions: 4, avg_score: 0.68 },
        { month: 'May', recognitions: 6, avg_score: 0.71 },
        { month: 'Jun', recognitions: 8, avg_score: 0.75 },
        { month: 'Jul', recognitions: 5, avg_score: 0.73 },
        { month: 'Aug', recognitions: 7, avg_score: 0.79 },
        { month: 'Sep', recognitions: 10, avg_score: 0.82 },
        { month: 'Oct', recognitions: 12, avg_score: 0.85 },
      ]);
      setSentimentData([
        { month: 'Apr', positive: 68, negative: 32 },
        { month: 'May', positive: 72, negative: 28 },
        { month: 'Jun', positive: 80, negative: 20 },
        { month: 'Jul', positive: 77, negative: 23 },
        { month: 'Aug', positive: 83, negative: 17 },
        { month: 'Sep', positive: 88, negative: 12 },
        { month: 'Oct', positive: 90, negative: 10 },
      ]);
    }
    fetchData();
  }, []);

  const formatPercent = v => `${Math.round(v * 100)}%`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><PieIcon className="text-indigo-600"/> Deep Analytics</h1>
            <p className="text-slate-500 text-sm">Insight into sentiment, KPIs, and recognition metrics</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-slate-400">Recognition Rate</div>
            <div className="text-2xl font-bold text-indigo-600">{formatPercent(kpi.recognition_rate)}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-slate-400">Average Officer Score</div>
            <div className="text-2xl font-bold text-green-600">{formatPercent(kpi.avg_officer_score)}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-slate-400">Cases Closed Rate</div>
            <div className="text-2xl font-bold text-sky-600">{formatPercent(kpi.cases_closed_rate)}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-slate-400">Community Sentiment</div>
            <div className="text-2xl font-bold text-amber-600">{formatPercent(kpi.community_sentiment)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="text-sky-600"/> Monthly Recognitions & Avg Score</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={monthlyTrends} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="recognitions" barSize={20} fill="#60A5FA" radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="avg_score" stroke="#2563EB" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Activity className="text-green-600"/> Sentiment Analysis Trends</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={sentimentData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#16A34A" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="#DC2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Gauge className="text-amber-500"/> KPI Insights</h3>
          <p className="text-sm text-slate-600 mb-2">This chart demonstrates the relative contribution of key performance metrics impacting officer recognition probability.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-700">35%</div>
              <div className="text-xs text-slate-500">Community Sentiment Impact</div>
            </div>
            <div className="p-4 bg-sky-50 rounded-lg">
              <div className="text-2xl font-bold text-sky-700">25%</div>
              <div className="text-xs text-slate-500">Case Closure Performance</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">30%</div>
              <div className="text-xs text-slate-500">Response Efficiency</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-700">10%</div>
              <div className="text-xs text-slate-500">Training & Teamwork</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
