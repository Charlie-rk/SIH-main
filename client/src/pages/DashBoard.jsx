import React, {useEffect, useState} from 'react';


import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Award, Users, ThumbsUp, Clock, Search, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

// ---------- Utility / Mock data helpers ----------
const formatPercent = (v) => `${Math.round(v * 100)}%`;

// Mock KPI aggregation (in real app, fetch from backend KPI endpoints)
const mockKPIs = () => ({
  recognition_rate: 0.12,
  avg_response_time_mins: 18,
  cases_closed_rate: 0.74,
  community_sentiment: 0.81,
});

const sampleOfficers = [
  { id: 'O-101', name: 'S. Patnaik', unit: 'Bhubaneswar North', score: 0.82 },
  { id: 'O-102', name: 'R. Das', unit: 'Cuttack Central', score: 0.68 },
  { id: 'O-103', name: 'M. Pradhan', unit: 'Paradeep', score: 0.62 },
  { id: 'O-104', name: 'A. Sahu', unit: 'Puri', score: 0.59 },
  { id: 'O-105', name: 'L. Nayak', unit: 'Rourkela', score: 0.95 },
];

const sentimentColor = (s) => (s === 'positive' ? 'text-green-600' : 'text-red-600');



export default function Dashboard(){
  // Dashboard state
  const [kpis, setKpis] = useState(mockKPIs());
  const [officers, setOfficers] = useState(sampleOfficers);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // AI text interaction
  const [inputText, setInputText] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState(null);

  // Analytics chart mock (monthly recognitions)
  const [monthlyData, setMonthlyData] = useState([
    { month: 'Apr', recognitions: 4 },
    { month: 'May', recognitions: 6 },
    { month: 'Jun', recognitions: 8 },
    { month: 'Jul', recognitions: 5 },
    { month: 'Aug', recognitions: 7 },
    { month: 'Sep', recognitions: 10 },
    { month: 'Oct', recognitions: 12 },
  ]);

  useEffect(() => {
    // In real app: fetch KPIs/officers from backend
    // Example: axios.get('/api/kpis').then(res => setKpis(res.data))
  }, []);

  // ---------- AI Inference Handler ----------
  async function callAiPredict(texts) {
    setLoadingAI(true);
    setError(null);
    try {
      const endpoint = (import.meta && import.meta.env && import.meta.env.VITE_AI_URL) ? import.meta.env.VITE_AI_URL : 'http://localhost:8000/predict';
      const resp = await axios.post(endpoint, { texts });
      // Expect resp.data.results
      const results = resp.data.results || resp.data;
      setAiResult(results[0]);
      setLoadingAI(false);
      return results;
    } catch (err) {
      console.error('AI call error', err);
      setError('AI service unavailable. Make sure backend is running at http://localhost:8000');
      setLoadingAI(false);
      return null;
    }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!inputText.trim()) return;
    const res = await callAiPredict([inputText.trim()]);
    // Optionally record result into officer timeline or backend
  }

  // ---------- UI Sub-components ----------
  const Header = () => (
    <header className="flex items-center justify-between py-6 px-6 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-b-2xl shadow-lg">
      <div className="flex items-center gap-4">
        <div className="bg-white/10 p-2 rounded-lg">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Police Recognition</h1>
          <p className="text-sm opacity-90">Odisha — Positive recognition & analytics</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-white/90">Logged in as <strong>Supervisor</strong></div>
        <div className="bg-white/10 px-3 py-2 rounded-lg text-sm">Settings</div>
      </div>
    </header>
  );

  const KPI = ({ icon, label, value, hint }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 rounded-lg text-sky-600">{icon}</div>
          <div>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-xl font-semibold mt-1">{value}</div>
          </div>
        </div>
        <div className="text-xs text-slate-400">{hint}</div>
      </div>
    </div>
  );

  const OfficerCard = ({ officer }) => (
    <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow hover:shadow-md cursor-pointer"
      onClick={() => setSelectedOfficer(officer)}>
      <div className="rounded-full bg-indigo-50 w-12 h-12 flex items-center justify-center text-indigo-600 font-semibold">{officer.name.split(' ')[1]?.[0] || 'O'}</div>
      <div className="flex-1">
        <div className="font-semibold">{officer.name}</div>
        <div className="text-xs text-slate-400">{officer.unit}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{Math.round(officer.score * 100)}</div>
        <div className="text-xs text-slate-400">score</div>
      </div>
    </motion.div>
  );

  const RecognitionPanel = () => (
    <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-2">Recognition Suggestions</h3>
      <p className="text-sm text-slate-500 mb-4">Auto-suggested based on KPIs & community feedback. Human approval required.</p>

      <div className="space-y-3">
        {officers.slice(0,4).map(o => (
          <div key={o.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-green-50 p-2 text-green-600"><ThumbsUp className="w-5 h-5"/></div>
              <div>
                <div className="font-medium">{o.name}</div>
                <div className="text-xs text-slate-400">{o.unit}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">{Math.round(o.score * 100)}</div>
              <button className="px-3 py-1 bg-sky-600 text-white rounded-lg text-sm" onClick={() => alert('Approve flow: Save recognition and log audit (demo)')}>Approve</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );

  const AiConsole = () => (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h4 className="font-semibold">NLP Assist — Analyze free-text feedback</h4>
      <p className="text-xs text-slate-400 mb-3">Paste a commendation or feedback; AI will label sentiment & tags.</p>
      <form onSubmit={handleAnalyze} className="space-y-3">
        <textarea className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="Type/paste feedback text here" value={inputText} onChange={(e) => setInputText(e.target.value)} />
        <div className="flex items-center gap-2">
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Analyze</button>
          <button type="button" className="px-4 py-2 border rounded-lg" onClick={() => { setInputText(''); setAiResult(null); }}>Clear</button>
          <div className="text-sm text-slate-400 ml-auto">AI status: {loadingAI ? 'Running…' : 'Idle'}</div>
        </div>
      </form>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {aiResult && (
        <div className="mt-4 border rounded-lg p-3 bg-slate-50">
          <div className="text-sm text-slate-500">Prediction</div>
          <div className="mt-2 flex items-center gap-4">
            <div className={`${sentimentColor(aiResult.sentiment)} font-semibold`}>{aiResult.sentiment.toUpperCase()}</div>
            <div className="text-xs text-slate-400">confidence: {Math.round(aiResult.confidence * 100)}%</div>
            <div className="text-sm text-slate-600 ml-4">tags: {aiResult.tags.length ? aiResult.tags.join(', ') : <span className="text-slate-400">no tags</span>}</div>
          </div>
          <div className="mt-2 text-xs text-slate-400">Text: {aiResult.text}</div>
        </div>
      )}
    </div>
  );

  const InsightsChart = () => (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h4 className="font-semibold mb-3">Monthly Recognitions</h4>
      <div style={{width: '100%', height: 220}}>
        <ResponsiveContainer>
          <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="recognitions" fill="#6366F1" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ---------- Layout ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 font-sans text-slate-800" style={{fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto'}}>
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPI icon={<Users />} label="Recognition Rate" value={formatPercent(kpis.recognition_rate)} hint="monthly" />
              <KPI icon={<Clock />} label="Avg Response Time" value={`${kpis.avg_response_time_mins} min`} hint="median" />
              <KPI icon={<Shield />} label="Cases Closed" value={formatPercent(kpis.cases_closed_rate)} hint="30-day" />
              <KPI icon={<Zap />} label="Community Sentiment" value={formatPercent(kpis.community_sentiment)} hint="aggregated" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <InsightsChart />

                <div className="bg-white rounded-2xl p-4 shadow">
                  <h4 className="font-semibold mb-3">Top Officers</h4>
                  <div className="space-y-3">
                    {officers.map(o => <OfficerCard key={o.id} officer={o} />)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <RecognitionPanel />
                <AiConsole />
              </div>
            </div>

          </section>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Quick Search</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input className="border p-2 rounded-lg w-full text-sm" placeholder="Search officer or unit" />
                    <button className="p-2 bg-sky-600 text-white rounded-lg"><Search className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow">
              <h4 className="font-semibold">Selected Officer</h4>
              {selectedOfficer ? (
                <div className="mt-3">
                  <div className="font-medium">{selectedOfficer.name}</div>
                  <div className="text-xs text-slate-400">{selectedOfficer.unit}</div>
                  <div className="mt-3 text-sm">Score: {Math.round(selectedOfficer.score * 100)}</div>
                  <div className="mt-3">
                    <button className="px-3 py-2 bg-sky-600 text-white rounded-lg" onClick={() => alert('Open station profile (demo)')}>View Profile</button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 mt-3">Click an officer to view details</div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow text-sm">
              <div className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-500"/> <div className="font-medium">Recent Recognitions</div></div>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li>S. Patnaik — DGP's Commendation Roll — Oct 2025</li>
                <li>L. Nayak — Community Policing Award — Sep 2025</li>
                <li>R. Das — Rapid Response Mention — Sep 2025</li>
              </ul>
            </div>

          </aside>
        </main>

        <footer className="mt-8 text-center text-xs text-slate-400">Built for Cyber Hackathon 2025 • Smart Analytics Dashboard — Odisha demo</footer>
      </div>
    </div>
  );
}