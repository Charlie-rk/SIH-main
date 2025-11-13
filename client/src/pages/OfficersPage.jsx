import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Award, MapPin, Shield, Star, ChevronLeft } from 'lucide-react';
import axios from 'axios';

// Officers Page - Smart Police Recognition Dashboard (Tailwind + React)
// - Lists all officers with search/filter
// - Click to open profile modal with officer details and commendations
// - API-ready: connects to /officers (GET) and /recognitions (GET) when available

export default function OfficersPage() {
  const [officers, setOfficers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [recognitions, setRecognitions] = useState([]);

  useEffect(() => {
    // Load officers (API or dummy)
    async function loadData() {
      try {
        const res = await axios.get('http://localhost:8000/officers');
        setOfficers(res.data);
        setFiltered(res.data);
      } catch {
        // fallback dummy data
        const dummy = [
          { id: 'O-101', name: 'S. Patnaik', unit: 'Bhubaneswar North', score: 0.82 },
          { id: 'O-102', name: 'R. Das', unit: 'Cuttack Central', score: 0.68 },
          { id: 'O-103', name: 'M. Pradhan', unit: 'Paradeep', score: 0.62 },
          { id: 'O-104', name: 'A. Sahu', unit: 'Puri', score: 0.59 },
          { id: 'O-105', name: 'L. Nayak', unit: 'Rourkela', score: 0.95 }
        ];
        setOfficers(dummy);
        setFiltered(dummy);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(officers);
    } else {
      const q = query.toLowerCase();
      setFiltered(officers.filter(o => o.name.toLowerCase().includes(q) || o.unit.toLowerCase().includes(q)));
    }
  }, [query, officers]);

  async function loadRecognitions(id) {
    try {
      const res = await axios.get('http://localhost:8000/recognitions');
      const recs = res.data.filter(r => r.officer_id === id);
      setRecognitions(recs);
    } catch {
      // Dummy recognitions
      const recs = [
        { id: 1, officer_id: 'O-101', summary: 'DGP Commendation Roll 2025', score: 0.91 },
        { id: 2, officer_id: 'O-101', summary: 'Rapid Response Award 2024', score: 0.85 }
      ];
      setRecognitions(recs.filter(r => r.officer_id === id));
    }
  }

  const openProfile = (officer) => {
    setSelected(officer);
    loadRecognitions(officer.id);
  };

  const closeProfile = () => {
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Officer Directory</h1>
            <p className="text-slate-500 text-sm">View and search all registered officers</p>
          </div>
          <div className="flex items-center gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search officer or unit" className="border rounded-lg px-3 py-2 text-sm w-60" />
            <Search className="text-slate-400 w-5 h-5 -ml-8" />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(o => (
            <motion.div key={o.id} whileHover={{ scale: 1.02 }} onClick={() => openProfile(o)}
              className="bg-white p-4 rounded-xl shadow hover:shadow-md cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-sky-100 text-sky-700 w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                    {o.name.split(' ')[1]?.[0] || 'O'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{o.name}</div>
                    <div className="text-xs text-slate-400">{o.unit}</div>
                  </div>
                </div>
                <Award className="text-amber-500 w-5 h-5" />
              </div>
              <div className="text-xs text-slate-500">Performance score</div>
              <div className="text-lg font-semibold text-slate-700">{Math.round(o.score * 100)} / 100</div>
            </motion.div>
          ))}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative">
              <button onClick={closeProfile} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mt-2">
                <div className="bg-indigo-50 text-indigo-600 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg">
                  {selected.name.split(' ')[1]?.[0] || 'O'}
                </div>
                <div>
                  <div className="text-xl font-semibold">{selected.name}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="w-4 h-4" /> {selected.unit}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 text-slate-700"><Shield className="w-5 h-5 text-sky-500" /> Score: {Math.round(selected.score * 100)}</div>
              </div>
              <div className="mt-5 border-t pt-3">
                <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> Recognitions</h4>
                {recognitions.length ? (
                  <ul className="text-sm text-slate-600 space-y-2">
                    {recognitions.map(r => (
                      <li key={r.id} className="bg-slate-50 rounded-md p-2 flex items-center justify-between">
                        <span>{r.summary}</span>
                        <span className="text-xs text-slate-400">{Math.round((r.score || 0) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400">No recognitions found</p>}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
