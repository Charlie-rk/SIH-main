import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { List, Shield, FileText, RefreshCw } from 'lucide-react';

// Admin / Audit Logs Page - Smart Police Recognition Dashboard
// Displays backend audit logs and KPI control panel.
// Uses dummy or API data (/audit_logs, /kpis) for now.

export default function AdminPage() {
  const [logs, setLogs] = useState([]);
  const [kpis, setKpis] = useState({ recognition_rate: 0.12, avg_officer_score: 0.79, cases_closed_rate: 0.74, community_sentiment: 0.81 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await axios.get('http://localhost:8000/audit_logs');
        setLogs(res.data);
      } catch {
        // Dummy logs
        setLogs([
          { id: 1, event_type: 'predict', created_at: '2025-11-12T10:10:00Z', payload: { count: 3 } },
          { id: 2, event_type: 'create_recognition', created_at: '2025-11-11T09:00:00Z', payload: { officer_id: 'O-101' } },
          { id: 3, event_type: 'kpis_view', created_at: '2025-11-10T08:00:00Z', payload: { avg_officer_score: 0.79 } },
        ]);
      }
      try {
        const kpiRes = await axios.get('http://localhost:8000/kpis');
        setKpis(kpiRes.data);
      } catch {}
    }
    loadData();
  }, []);

  const refreshLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/audit_logs');
      setLogs(res.data);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Shield className="text-indigo-600"/> Admin Panel</h1>
            <p className="text-slate-500 text-sm">Audit logs and KPI management</p>
          </div>
          <button onClick={refreshLogs} disabled={loading} className="bg-sky-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm hover:bg-sky-700">
            <RefreshCw className="w-4 h-4"/> {loading ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><FileText className="text-sky-600"/> KPI Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <div className="text-xs text-slate-400">Recognition Rate</div>
              <div className="text-2xl font-bold text-indigo-600">{(kpis.recognition_rate * 100).toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <div className="text-xs text-slate-400">Avg Officer Score</div>
              <div className="text-2xl font-bold text-green-600">{(kpis.avg_officer_score * 100).toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <div className="text-xs text-slate-400">Case Closure Rate</div>
              <div className="text-2xl font-bold text-sky-600">{(kpis.cases_closed_rate * 100).toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <div className="text-xs text-slate-400">Community Sentiment</div>
              <div className="text-2xl font-bold text-amber-600">{(kpis.community_sentiment * 100).toFixed(1)}%</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><List className="text-amber-600"/> Audit Logs</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Event Type</th>
                  <th className="px-4 py-2 text-left">Payload</th>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.length ? logs.map(l => (
                  <tr key={l.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2">{l.id}</td>
                    <td className="px-4 py-2 font-medium">{l.event_type}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{JSON.stringify(l.payload)}</td>
                    <td className="px-4 py-2 text-xs text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-4 text-slate-400">No logs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
