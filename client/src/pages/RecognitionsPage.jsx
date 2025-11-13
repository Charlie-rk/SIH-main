import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Award, ThumbsUp, UserCheck, PlusCircle } from 'lucide-react';

// Recognitions Page - Smart Police Recognition Dashboard (Tailwind + React)
// Displays list of recognitions, allows approving/creating new recognition entries.
// Uses dummy data or connects to FastAPI endpoints /recognitions and /officers.

export default function RecognitionsPage() {
  const [recognitions, setRecognitions] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ officer_id: '', summary: '', score: '', approved_by: 'Supervisor A' });
  const [loading, setLoading] = useState(false);

  // Load recognitions & officers
  useEffect(() => {
    async function loadData() {
      try {
        const recRes = await axios.get('http://localhost:8000/recognitions');
        setRecognitions(recRes.data);
      } catch {
        // Dummy recognitions
        setRecognitions([
          { id: 1, officer_id: 'O-101', summary: 'DGP Commendation Roll 2025', score: 0.91, approved_by: 'SP Cuttack' },
          { id: 2, officer_id: 'O-105', summary: 'Community Policing Award', score: 0.88, approved_by: 'DGP Odisha' },
          { id: 3, officer_id: 'O-102', summary: 'Rapid Response Award', score: 0.85, approved_by: 'SP Bhubaneswar' },
        ]);
      }
      try {
        const offRes = await axios.get('http://localhost:8000/officers');
        setOfficers(offRes.data);
      } catch {
        setOfficers([
          { id: 'O-101', name: 'S. Patnaik' },
          { id: 'O-102', name: 'R. Das' },
          { id: 'O-103', name: 'M. Pradhan' },
          { id: 'O-104', name: 'A. Sahu' },
          { id: 'O-105', name: 'L. Nayak' },
        ]);
      }
    }
    loadData();
  }, []);

  // Add new recognition
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.officer_id || !form.summary) return alert('Fill all fields');
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/recognitions', form);
      setRecognitions(prev => [
        { id: Date.now(), officer_id: form.officer_id, summary: form.summary, score: parseFloat(form.score) || 0.8, approved_by: form.approved_by },
        ...prev
      ]);
      setShowForm(false);
    } catch {
      setRecognitions(prev => [
        { id: Date.now(), officer_id: form.officer_id, summary: form.summary, score: parseFloat(form.score) || 0.8, approved_by: form.approved_by },
        ...prev
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Award className="text-amber-500"/> Recognitions</h1>
            <p className="text-slate-500 text-sm">Review and create recognition entries</p>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-sky-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm hover:bg-sky-700">
            <PlusCircle className="w-5 h-5"/> New Recognition
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recognitions.map(r => (
            <motion.div key={r.id} whileHover={{ scale: 1.01 }} className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="text-green-500"/>
                    <div className="font-semibold text-slate-800">{r.summary}</div>
                  </div>
                  <div className="text-xs text-slate-400">{Math.round((r.score || 0) * 100)}%</div>
                </div>
                <div className="text-sm text-slate-500">Officer: <span className="font-medium">{r.officer_id}</span></div>
              </div>
              <div className="mt-3 text-xs text-slate-400">Approved by {r.approved_by}</div>
            </motion.div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create Recognition</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500">Officer</label>
                  <select className="border rounded-lg px-3 py-2 w-full" value={form.officer_id} onChange={(e) => setForm({ ...form, officer_id: e.target.value })}>
                    <option value="">Select officer</option>
                    {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Summary</label>
                  <input className="border rounded-lg px-3 py-2 w-full" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="e.g., Community Policing Award 2025" />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Score (0-1)</label>
                  <input className="border rounded-lg px-3 py-2 w-full" type="number" step="0.01" min="0" max="1" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border rounded-lg text-slate-600">Cancel</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded-lg">
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
