import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';
import {
  AlertTriangle, CheckCircle, TrendingUp, Users, Award, Briefcase,
  ScatterChart as ScatterIcon, Activity, Shield, Brain, Bell,
  BarChart3, RefreshCw, Download, Calendar, Filter, Eye,
  Zap, Target, Globe, Database, ChevronUp, ChevronDown,
  Map as MapIcon, Trophy, TrendingDown as TrendingDownIcon, UserCheck, Droplet,
  Truck, Search, Waves,
  X, FileText // --- [NEW] --- Added icons for modal
} from 'lucide-react';

// New imports for the map
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import axios from 'axios'; // For fetching GeoJSON

// --- [NEW] --- Imports for PDF Export
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // Note: Not used by the PDF func, but included
import Papa from 'papaparse';

// Import all our NEW API functions
import * as api from '../services/API';
import { useAuth } from '../context/AuthContext'; // To get user info

// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- [NEW] Helper function for Markdown to HTML
const markdownToHtml = (text) => {
  if (!text) return "";
  return text.replace(
    /\*\*(.*?)\*\*/g, 
    '<strong class="font-semibold text-gray-900">$1</strong>'
  );
};

// --- [NEW] --- PDF Export Modal Component ---

// This is a re-usable Checkbox component for our form
const CheckboxItem = ({ label, id, checked, onChange }) => (
  <label
    htmlFor={id}
    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer"
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </label>
);

const PdfExportModal = ({ isOpen, onClose, onExport }) => {
  const [options, setOptions] = useState({
    kpis: true,
    alerts: true,
    map: true,
    summary: true,
    leaderboard: true,
    spotlight: true,
    officers: true,
  });
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' or 'csv'

  const handleChange = (e) => {
    const { id, checked } = e.target;
    setOptions((prev) => ({ ...prev, [id]: checked }));
  };

  const handleSubmit = () => {
    onExport(options, exportFormat);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 gradient-primary rounded-xl shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Export Report</h2>
              <p className="text-sm text-gray-500 mt-1">Select format and sections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Export Format</label>
          <div className="flex gap-3">
            <button
              onClick={() => setExportFormat('pdf')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                exportFormat === 'pdf'
                  ? 'gradient-primary text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              PDF 
            </button>
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                exportFormat === 'csv'
                  ? 'gradient-primary text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              CSV
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <CheckboxItem id="kpis" label="KPI Stats Cards" checked={options.kpis} onChange={handleChange} />
          <CheckboxItem id="alerts" label="AI Forecast" checked={options.alerts} onChange={handleChange} />
          <CheckboxItem id="map" label="Geo-Analytics Map" checked={options.map} onChange={handleChange} />
          <CheckboxItem id="summary" label="AI Summary" checked={options.summary} onChange={handleChange} />
          <CheckboxItem id="leaderboard" label="Drive Leaderboard" checked={options.leaderboard} onChange={handleChange} />
          <CheckboxItem id="spotlight" label="District Spotlight" checked={options.spotlight} onChange={handleChange} />
          <CheckboxItem id="officers" label="Top Officers" checked={options.officers} onChange={handleChange} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 gradient-primary text-white rounded-xl shadow-lg text-sm font-medium hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generate {exportFormat.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- REUSABLE UI COMPONENTS (From Master) ---
const DashboardCard = ({ title, icon, children, gridSpan = "col-span-1", delay = 0, badge = null, height = "h-[400px]" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [goodWorkReportData, setGoodWorkReportData] = useState([]);
 const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);
  

  const good_data = async () => {
    try {
      const data = await Promise.allSettled([api.fetchGoodWorkReport()]);
      if (data[0].status === "fulfilled") {
        setGoodWorkReportData(data[0].value);
      }
    } catch (error) {
      console.error("Error fetching Good Work Report:", error);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    good_data();
  }, []);
  useEffect(() => {
    setTimeout(() => setIsVisible(true), delay);
  }, [delay]);
  
  return (
    <div className={`glass-card glass-card-hover rounded-2xl p-6 ${gridSpan} ${isVisible ? 'slide-up' : 'opacity-0'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 gradient-primary rounded-xl shadow-lg transform hover:scale-110 transition-transform">
            {React.cloneElement(icon, { className: "w-5 h-5 text-white" })}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time insights</p>
          </div>
        </div>
        {badge && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} ${badge.pulse ? 'pulse' : ''}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className={height}>
        {children}
      </div>
      {/* === AUTO-REPORT: EXCEPTIONAL PERFORMANCE === */}
<div className="mt-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
  <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
    <FileText className="w-6 h-6" /> Auto-Report: Exceptional Performance
  </h2>

  {reportLoading ? (
    <div className="text-center py-10 text-slate-500">
      Loading live report data...
    </div>
  ) : (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firearms</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {goodWorkReportData.slice(0, 10).map((row, i) => (
            <tr key={i} className={row.Rank === 1 ? "bg-amber-50" : "hover:bg-slate-50"}>
              <td className="px-6 py-4 text-sm text-gray-900">{row.Rank}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{row.District}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{row.ConvictionRate}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{row.FirearmsSeized}</td>
              <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                {row.GoodWorkScore}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

    </div>
  );
};

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 z-50">
    <div className="text-center">
      <div className="relative">
        <div className="w-32 h-32 border-4 border-blue-200 rounded-full animate-spin border-t-transparent">
          <div className="absolute inset-4 border-4 border-indigo-200 rounded-full animate-spin border-t-transparent animate-reverse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-12 h-12 text-blue-600 float-animation" />
        </div>
      </div>
      <div className="mt-8 space-y-2">
        <p className="text-2xl font-bold text-gray-800">State Command Center</p>
        <p className="text-sm text-gray-600">Loading CCTNS intelligence data...</p>
      </div>
    </div>
  </div>
);

const StatsCard = ({ title, value, change, icon, color, subtitle, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Ensure value is not undefined before parsing
      const safeValue = value ?? 0;
      const target = typeof safeValue === 'string' ? parseFloat(safeValue.replace(/[^0-9.]/g, '')) : safeValue;
      
      if (isNaN(target)) {
        setDisplayValue(safeValue);
        return;
      }
      
      const duration = 1500, steps = 60, stepValue = target / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= target) {
          setDisplayValue(target);
          clearInterval(interval);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const formatDisplayValue = () => {
    if (typeof displayValue === 'number') {
      // Ensure value is not undefined before calling toString()
      const sValue = (value || '').toString(); 
      if (sValue.includes('%')) return `${displayValue.toFixed(1)}%`;
      if (sValue.includes('k')) return `${(displayValue / 1000).toFixed(1)}k`;
      return displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return displayValue;
  };
  
  return (
    <div className={`glass-card rounded-xl p-6 transform hover:scale-105 transition-all duration-300 ${isVisible ? 'slide-up' : 'opacity-0'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          <p className="text-4xl font-bold text-gray-900 mt-3 ticker">
            {formatDisplayValue()}
          </p>
          {change !== undefined && (
            <div className="flex items-center mt-3">
              {change > 0 ? (
                <ChevronUp className="w-5 h-5 text-green-500 mr-1" />
              ) : (
                <ChevronDown className="w-5 h-5 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-lg transform hover:rotate-6 transition-transform`}>
          {React.cloneElement(icon, { className: "w-8 h-8 text-white" })}
        </div>
      </div>
    </div>
  );
};

// --- WIDGET 1: AI Smart Alerts (Forecast) (From Master) ---
const AiForecastWidget = ({ alerts, diagnostics, summary }) => {
  if (!diagnostics) diagnostics = {};
  const entries = Object.entries(diagnostics);

  // Convert diagnostics into chart-friendly arrays
  const projectedChanges = entries.map(([district, info]) => ({
    district,
    slope: info.slope,
    last: info.lastValue,
    next: info.projectedNextValue,
    pct: info.projectedPercentChange * 100,
  }));

  const topRisers = [...projectedChanges]
    .sort((a,b)=> b.pct - a.pct)
    .slice(0,5);

  const topFallers = [...projectedChanges]
    .sort((a,b)=> a.pct - b.pct)
    .slice(0,5);

  return (
    <div className="glass-card rounded-2xl p-6 slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 gradient-danger rounded-xl shadow-lg">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">AI Performance Forecast</h2>
            <p className="text-sm text-gray-500 mt-1">“Districts to Watch” (Pendency Forecast)</p>
          </div>
        </div>
      </div>

      {/* Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-xs text-gray-600">Total Districts</p>
          <p className="text-xl font-bold text-blue-700">{summary?.totalDistricts || entries.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-xs text-gray-600">Avg Projected Change</p>
          <p className="text-xl font-bold text-green-700">
            {(
              projectedChanges.reduce((a,b)=>a+b.pct,0) / (projectedChanges.length || 1) // Avoid divide by zero
            ).toFixed(2)}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-xs text-gray-600">Rising Districts</p>
          <p className="text-xl font-bold text-red-700">
            {projectedChanges.filter(p=>p.pct > 0).length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-gray-600">Falling Districts</p>
          <p className="text-xl font-bold text-emerald-700">
            {projectedChanges.filter(p=>p.pct < 0).length}
          </p>
        </div>
      </div>

      {/* If no alerts */}
      {(!alerts || alerts.length === 0) && (
        <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
          No threshold-based alerts triggered. Below is the full AI trend analysis for all districts.
        </div>
      )}

      {/* Top Risers & Fallers Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl border bg-white">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
            <TrendingUp className="text-green-500 w-4 h-4" /> Top 5 Rising (Projected Increase)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topRisers}>
              <XAxis dataKey="district" tick={{fontSize:10}} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pct" fill="#16a34a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 rounded-xl border bg-white">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
            <TrendingDownIcon className="text-red-500 w-4 h-4" /> Top 5 Falling (Projected Decrease)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topFallers}>
              <XAxis dataKey="district" tick={{fontSize:10}} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pct" fill="#dc2626" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed District Table */}
      <div className="rounded-xl border bg-white p-4 h-80 overflow-y-auto custom-scrollbar">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">District Forecast Details</h3>

        <table className="w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-2 text-gray-900">District</th>
              <th className="p-2 text-gray-900">Last</th>
              <th className="p-2 text-gray-900">Projected</th>
              <th className="p-2 text-gray-900">% Change</th>
              <th className="p-2 text-gray-900">Slope</th>
              <th className="p-2 text-gray-900">Reason</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([district, info]) => (
              <tr key={district} className="border-b hover:bg-gray-50">
                <td className="p-2 font-semibold text-gray-900">{district}</td>
                <td className="p-2 text-gray-900">{info.lastValue}</td>
                <td className="p-2 text-gray-900">{info.projectedNextValue.toFixed(1)}</td>
                <td className={`p-2 font-bold ${info.projectedPercentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(info.projectedPercentChange * 100).toFixed(2)}%
                </td>
                <td className="p-2 text-gray-900">{info.slope.toFixed(2)}</td>
                <td className="p-2 text-gray-500">{info.reasonSkipped || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- WIDGET 2: AI Monthly Summary (NLG) (From Master) ---
// --- [NOTE] --- This component is now fed HTML from the markdownToHtml() helper
const AiSummaryWidget = ({ summary }) => (
  <DashboardCard title="AI Monthly Summary (NLG)" icon={<Brain />} delay={100} height="h-[300px]">
    <div className="h-full flex flex-col justify-center">
      <p className="text-lg text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: summary || "Generating summary..." }}
      />
    </div>
  </DashboardCard>
);

// --- WIDGET 3: Special Drive Leaderboard (Gamification) (From Master) ---
const DriveLeaderboardWidget = () => {
  const [metric, setMetric] = useState('narcotics_ganja_kg');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await api.getDriveLeaderboard(metric);
        setData(result.slice(0, 10)); // Get Top 10
      } catch (err) {
        console.error("Failed to load leaderboard data:", err);
      }
      setLoading(false);
    };
    loadData();
  }, [metric]); 

  const metrics = [
    { key: 'narcotics_ganja_kg', name: 'Ganja (Kg)', icon: <Waves /> },
    { key: 'narcotics_brownsugar_gm', name: 'Brownsugar (gm)', icon: <Droplet /> },
    { key: 'firearms_seized', name: 'Firearms', icon: <Target /> },
    { key: 'sand_mining_cases', name: 'Sand Mining', icon: <Truck /> },
    { key: 'nbw_executed', name: 'NBW Executed', icon: <UserCheck /> }
  ];

  return (
    <DashboardCard title="Special Drive Leaderboard" icon={<Trophy />} delay={200} gridSpan="col-span-1 lg:col-span-2">
      <div className="h-full flex flex-col">
        <div className="flex gap-2 mb-4">
          {metrics.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                metric === m.key
                  ? 'gradient-blue text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {React.cloneElement(m.icon, {className: "w-4 h-4"})}
              {m.name}
            </button>
          ))}
        </div>
        <div className="flex-1">
          {loading ? <p className="text-gray-400">Loading...</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="district" type="category" stroke="#6b7280" tick={{ fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" name={metrics.find(m=>m.key === metric).name} fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </DashboardCard>
  );
};

// --- WIDGET 4: Geo-Analytics Map (GIS) ---
// --- [UPDATED] --- This is the version from the second file with the UI fix
const GeoAnalyticsWidget = ({ mapData }) => {
  const [geoData, setGeoData] = useState(null);
  const [mapMetric, setMapMetric] = useState('conviction_rate');
  const mapRef = useRef(null);

  const GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@8d907bc/geojson/states/odisha.geojson';

  useEffect(() => {
    async function loadGeo() {
      try {
        const res = await axios.get(GEOJSON_URL, { responseType: 'json', timeout: 10000 });
        setGeoData(res.data);
      } catch (err) {
        console.error('Failed to fetch GeoJSON:', err);
      }
    }
    loadGeo();
  }, []);

  const metricsMap = mapData; // Use the data from our API

  const extractDistrictName = (props = {}) => {
    return (
      props.dtname || props.DTNAME || props.DISTRICT || props.district ||
      props.NAME_2 || props.NAME || props.name || 'Unknown'
    );
  };

  const getColor = (value, metric) => {
    if (metric === 'conviction_rate' || metric === 'nbw_executed') {
      if (value > 75) return '#166534'; if (value > 60) return '#15803d';
      if (value > 45) return '#22c55e'; if (value > 30) return '#86efac';
      return '#dcfce7';
    }
    if (metric === 'narcotics_ganja_kg' || metric === 'firearms_seized') {
      if (value > 1000) return '#b91c1c'; if (value > 500) return '#dc2626';
      if (value > 100) return '#f87171'; if (value > 10) return '#fecaca';
      return '#fee2e2';
    }
    return '#ccc';
  };

  const geoStyle = (feature) => {
    const name = extractDistrictName(feature.properties);
    const metric = metricsMap[name] ? metricsMap[name][mapMetric] : 0;
    const value = (typeof metric === 'number') ? metric : 0;
    
    return {
      fillColor: getColor(value, mapMetric),
      fillOpacity: 0.7,
      color: '#475569',
      weight: 1,
    };
  };

  const onEachDistrict = (feature, layer) => {
    const name = extractDistrictName(feature.properties);
    const region = metricsMap[name] || {};
    
    layer.on({
      mouseover: (e) => e.target.setStyle({ weight: 3, color: '#1e293b', fillOpacity: 0.9 }),
      mouseout: (e) => layer.setStyle(geoStyle(feature)),
    });

    const popupHtml = `
      <div style="font-family: Inter, sans-serif; min-width:140px;">
        <strong style="color: #1e293b; font-size: 14px;">${name}</strong><br />
        <p style="margin: 4px 0; font-size: 12px; color: #334155;">
          Conviction Rate: <strong style="color: #059669;">${(region.conviction_rate || 0).toFixed(1)}%</strong>
        </p>
        <p style="margin: 4px 0; font-size: 12px; color: #334155;">
          NBWs Executed: <strong style="color: #059669;">${region.nbw_executed || 0}</strong>
        </p>
          <p style="margin: 4px 0; font-size: 12px; color: #334155;">
          Ganja Seized (Kg): <strong style="color: #dc2626;">${region.narcotics_ganja_kg || 0}</strong>
        </p>
      </div>`;
    layer.bindPopup(popupHtml);
  };

  return (
    <DashboardCard
      title="Odisha 'Good Work' Geo-Analytics"
      icon={<MapIcon />}
      gridSpan="col-span-1 lg:col-span-2"
      delay={300}
      height="h-[500px]" // Taller card for the map
    >
      <div className="h-full flex flex-col">
        <div className="flex justify-end mb-2">
          {/* --- [THIS IS THE UI FIX] --- */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setMapMetric('conviction_rate')} 
              className={`px-3 py-1 rounded-md text-xs transition-all ${mapMetric === 'conviction_rate' ? 'bg-white shadow-sm text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
              Conviction
            </button>
            <button 
              onClick={() => setMapMetric('nbw_executed')} 
              className={`px-3 py-1 rounded-md text-xs transition-all ${mapMetric === 'nbw_executed' ? 'bg-white shadow-sm text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
              NBW
            </button>
            <button 
              onClick={() => setMapMetric('narcotics_ganja_kg')} 
              className={`px-3 py-1 rounded-md text-xs transition-all ${mapMetric === 'narcotics_ganja_kg' ? 'bg-white shadow-sm text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
              Ganja
            </button>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
          {geoData ? (
            <MapContainer
              center={[20.95, 84.5]}
              zoom={6.8}
              style={{ height: '100%', width: '100%', backgroundColor: '#f0f9ff' }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <GeoJSON
                data={geoData}
                style={geoStyle}
                onEachFeature={onEachDistrict}
                key={mapMetric} // Force re-render on metric change
              />
            </MapContainer>
          ) : (
            <div className="p-10 text-center text-gray-500">Loading Odisha map...</div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
};


// --- WIDGET 8: District Performance Spotlight (From Master) ---
const DistrictSpotlightWidget = ({ prideData, workloadData }) => {
  const topPride = [...(prideData || [])].sort((a, b) => b.score - a.score).slice(0, 3);
  const bottomPride = [...(prideData || [])].sort((a, b) => a.score - b.score).slice(0, 3);
  const topWorkload = [...(workloadData || [])].sort((a, b) => b.ratio - a.ratio).slice(0, 3);

  const ListItem = ({ rank, text, value, color }) => (
    <li className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${color}`}>{rank}.</span>
        <span className="text-sm font-medium text-gray-700">{text}</span>
      </div>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </li>
  );

  return (
    <DashboardCard
      title="District Performance Spotlight"
      icon={<Trophy />}
      gridSpan="col-span-1"
      delay={700}
    >
      <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Best */}
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-green-600 mb-2">Top 3 (Conviction Rate)</h3>
          <ul className="space-y-1">
            {topPride.map((d, i) => (
              <ListItem key={d.district} rank={i+1} text={d.district} value={d.score} color="text-green-600" />
            ))}
          </ul>
          <h3 className="text-sm font-semibold text-red-600 mb-2 mt-4">Top 3 (Highest Workload)</h3>
          <ul className="space-y-1">
            {topWorkload.map((d, i) => (
              <ListItem key={d.district} rank={i+1} text={d.district} value={d.ratio} color="text-red-600" />
            ))}
          </ul>
        </div>
        {/* Right Column: Focus */}
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-yellow-600 mb-2">Areas for Focus (Bottom 3 Conviction)</h3>
          <ul className="space-y-1">
            {bottomPride.map((d, i) => (
              <ListItem key={d.district} rank={i+1} text={d.district} value={d.score} color="text-yellow-600" />
            ))}
          </ul>
        </div>
      </div>
    </DashboardCard>
  );
};

// --- WIDGET 9: Top Officers (From Master) ---
// const TopOfficersWidget = ({ data }) => {
//   return (
//     <DashboardCard
//       title="Top Performing Officers"
//       icon={<UserCheck />}
//       gridSpan="col-span-1"
//       delay={800}
//       badge={{ text: 'State-Wide', color: 'bg-blue-100 text-blue-800' }}
//     >
//       <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
//         <ul className="space-y-2">
//           {(data || []).map((officer, index) => (
//             <li
//               key={officer.name}
//               className="flex items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
//               style={{animationDelay: `${index * 50}ms`}}
//             >
//               <span className="text-lg font-bold text-blue-700 w-8">{index + 1}.</span>
//               <div className="flex-1">
//                 <p className="text-sm font-semibold text-gray-800">{officer.name}</p>
//                 <p className="text-xs text-gray-500">ID: {officer.name.split('(')[1].replace(')', '')}</p>
//               </div>
//               <div className="text-right">
//                 <p className="text-lg font-bold text-blue-600">{officer.recognitions}</p>
//                 <p className="text-xs text-gray-500">Recognitions</p>
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </DashboardCard>
//   );
// };

// --- WIDGET 10: TrendAnalysisWidget (From Master) ---
const TrendAnalysisWidget = () => {
  const METRICS = [
    { key: 'narcotics_ganja_kg', name: 'Ganja (kg)', unit: 'kg' },
    { key: 'narcotics_brownsugar_gm', name: 'Brownsugar (g)', unit: 'g' },
    { key: 'nbw_executed', name: 'NBW Executed', unit: 'count' },
    { key: 'firearms_seized', name: 'Firearms Seized', unit: 'count' },
    { key: 'conviction_rate', name: 'Conviction Rate', unit: '%' },
    { key: 'sand_cases', name: 'Sand Mining Cases', unit: 'count' }
  ];

  const [metric, setMetric] = useState(METRICS[0].key);
  const [months, setMonths] = useState(6);
  const [trendData, setTrendData] = useState({ months: [], series: [], unit: '' });
  const [loading, setLoading] = useState(true);
  const [topN, setTopN] = useState(5);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getTrend(metric, months, topN);
        if (!mounted) return;
        setTrendData(res);
      } catch (err) {
        console.error('Trend load failed', err);
        if (mounted) setTrendData({ months: [], series: [], unit: '' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [metric, months, topN]); 

  // Compose data for recharts: produce array of objects { month: '2025-03', 'Ganjam': 120, 'Khordha': 50, ...}
  const chartData = trendData.months.map((m, idx) => {
    const obj = { month: m };
    (trendData.series || []).forEach(s => {
      obj[s.district] = (s.values && s.values[idx] !== undefined) ? s.values[idx] : 0;
    });
    return obj;
  });

  // Colors for lines — cycle
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <DashboardCard title="Trend Analysis (Month-wise / Drive-wise)" icon={<TrendingUp />} delay={400} gridSpan="col-span-1 lg:col-span-2" height="h-[420px]">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <select value={metric} onChange={(e)=>setMetric(e.target.value)} className="px-3 py-1 rounded-md border bg-white text-gray-800">
              {METRICS.map(m => <option key={m.key} value={m.key}>{m.name}</option>)}
            </select>
            <select value={months} onChange={(e)=>setMonths(Number(e.target.value))} className="px-3 py-1 rounded-md border bg-white text-gray-800">
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
            <select value={topN} onChange={(e)=>setTopN(Number(e.target.value))} className="px-3 py-1 rounded-md border bg-white text-gray-800">
              <option value={3}>Top 3</option>
              <option value={5}>Top 5</option>
              <option value={8}>Top 8</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">Unit: <strong>{trendData.unit || METRICS.find(m=>m.key===metric).unit}</strong></div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 h-[300px]">
            {loading ? <div className="p-6 text-center text-gray-400">Loading trend...</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  {(trendData.series || []).map((s, i) => (
                    <Line
                      key={s.district}
                      type="monotone"
                      dataKey={s.district}
                      stroke={colors[i % colors.length]}
                      activeDot={{ r: 6 }}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="h-[300px] p-3 overflow-y-auto custom-scrollbar bg-white rounded-xl border">
            <h4 className="text-sm font-semibold mb-2 text-gray-800">Top Districts (by total)</h4>
            <ul className="space-y-2">
              {(!trendData.series || trendData.series.length === 0) && <li className="text-sm text-gray-400">No data</li>}
              {(trendData.series || []).map((s, idx) => {
                // percent change between last two months for arrow
                const last = s.values[s.values.length - 1] || 0;
                const prev = s.values[s.values.length - 2] || 0;
                const pct = prev === 0 ? (last === 0 ? 0 : 100) : ((last - prev) / Math.abs(prev) * 100);
                return (
                  <li key={s.district} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{s.district}</div>
                      <div className="text-xs text-gray-500">Total: {(+s.total).toLocaleString()} {trendData.unit || METRICS.find(m=>m.key===metric).unit}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pct >= 0 ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />}
                        {Math.abs(pct).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">vs prev month</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

// --- WIDGET 11: TopDistrictsWidget (From Master) ---
const TopDistrictsWidget = () => {
  const [metric, setMetric] = useState('narcotics_ganja_kg');
  const [months, setMonths] = useState(6);
  const [top, setTop] = useState(5);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getTopDistricts(metric, months, top);
        if (!mounted) return;
        setData(res);
      } catch (err) {
        console.error('Top districts fetch failed', err);
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [metric, months, top]); 

  return (
    <DashboardCard title="Top Performing Districts (Trend Summary)" icon={<Trophy />} delay={700} gridSpan="col-span-1" height="h-[300px]">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <select value={metric} onChange={e=>setMetric(e.target.value)} className="px-3 py-1 rounded-md border text-sm bg-white text-gray-800">
              <option value="narcotics_ganja_kg">Ganja (kg)</option>
              <option value="narcotics_brownsugar_gm">Brownsugar (g)</option>
              <option value="nbw_executed">NBW Executed</option>
              <option value="firearms_seized">Firearms Seized</option>
              <option value="conviction_rate">Conviction Rate</option>
            </select>
            <select value={months} onChange={e=>setMonths(Number(e.target.value))} className="px-3 py-1 rounded-md border text-sm bg-white text-gray-800">
              <option value={3}>3m</option>
              <option value={6}>6m</option>
              <option value={12}>12m</option>
            </select>
          </div>
          <div className="text-xs text-gray-500">Top {top}</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="text-gray-400 p-4">Loading...</div> : (
            <ul className="space-y-2">
              {data.map((d, idx) => (
                <li key={d.district} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-gray-50 border text-gray-800">
                  <div>
                    <div className="text-sm font-semibold">{idx + 1}. {d.district}</div>
                    <div className="text-xs text-gray-500">Total: {(+d.total).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">{Math.round(d.total)}</div>
                    <div className="text-xs text-gray-400">sum over last {months} months</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardCard>
  );
};


// --- Main DGP Dashboard Component ---
function DGPDashboard() {
  const { user } = useAuth();
  
  // State for all data
  const [summary, setSummary] = useState("");
  const [alerts, setAlerts] = useState({ alerts: [], diagnostics: {}, summary: null });
  const [convictionRates, setConvictionRates] = useState([]);
  const [mapData, setMapData] = useState({});
  const [topOfficers, setTopOfficers] = useState([]);
  const [workload, setWorkload] = useState([]);
  
  const [nbwTotal, setNbwTotal] = useState(0);
  const [firearmsTotal, setFirearmsTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- [NEW] --- State for PDF Modal and Generation
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Fetch all data
  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.getMonthlySummary(),       // 0
        api.getPerformanceForecast(),    // 1
        api.getConvictionRates(),      // 2
        api.getMapData(),              // 3
        api.getDriveLeaderboard('nbw_executed'),    // 4
        api.getDriveLeaderboard('firearms_seized')  // 5
      ]);
      
      console.log(results);
      
      // --- [UPDATED] --- Use markdownToHtml converter for bold text fix
      if (results[0].status === 'fulfilled') {
        setSummary(markdownToHtml(results[0].value.summary));
      }
      if (results[1].status === 'fulfilled') setAlerts(results[1].value); 
      if (results[2].status === 'fulfilled') setConvictionRates(results[2].value);
      if (results[3].status === 'fulfilled') setMapData(results[3].value);
      
      if (results[4].status === 'fulfilled') {
        const nbwData = results[4].value;
        setNbwTotal(nbwData.reduce((acc, d) => acc + (d.value || 0), 0));
      }
      if (results[5].status === 'fulfilled') {
        const firearmsData = results[5].value;
        setFirearmsTotal(firearmsData.reduce((acc, d) => acc + (d.value || 0), 0));
      }
      
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []); 
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- [NEW] --- Export Handler Function ---
  const handleExportPdf = async (options, format) => {
    setIsPdfModalOpen(false);
    setIsGeneratingPdf(true);

    // Get current KPI values for the report
    const kpiConviction = convictionRates[0] ? convictionRates[0].rate.toFixed(1) + '%' : '0%';
    const kpiAlerts = (alerts && alerts.alerts) ? alerts.alerts.length : 0;
    const kpiNbwExecuted = nbwTotal;
    const kpiFirearmsSeized = firearmsTotal;

    try {
      if (format === 'csv') {
        await generateCSV(options, { kpiConviction, kpiAlerts, kpiNbwExecuted, kpiFirearmsSeized });
      } else {
        await generatePDF(options, { kpiConviction, kpiAlerts, kpiNbwExecuted, kpiFirearmsSeized });
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to generate ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- [NEW] --- CSV Generation Function ---
  const generateCSV = async (options, kpiData) => {
    const csvData = [];

    // 1. KPI Stats
    if (options.kpis) {
      csvData.push(['SECTION', 'KEY PERFORMANCE INDICATORS']);
      csvData.push(['Metric', 'Value', 'Change vs Last Month', 'Subtitle']);
      csvData.push(['State Conviction Rate', kpiData.kpiConviction, '+5.2%', 'IPC/BNS Cases (This Month)']);
      csvData.push(['Active AI Alerts', kpiData.kpiAlerts, '-2%', 'AI detected anomalies']);
      csvData.push(['NBWs Executed', kpiData.kpiNbwExecuted, '+15%', 'This Month']);
      csvData.push(['Firearms Seized', kpiData.kpiFirearmsSeized, '+8%', 'This Month']);
      csvData.push([]);
    }

    // 2. AI Forecast
    if (options.alerts) {
      csvData.push(['SECTION', 'AI PERFORMANCE FORECAST']);
      csvData.push(['District', 'Last Value', 'Projected Value', 'Projected % Change', 'Slope', 'Reason Skipped']);
      const diagnostics = alerts.diagnostics || {};
      Object.entries(diagnostics).forEach(([district, info]) => {
        csvData.push([
          district,
          info.lastValue,
          info.projectedNextValue,
          info.projectedPercentChange,
          info.slope,
          info.reasonSkipped || 'N/A'
        ]);
      });
      csvData.push([]);
    }

    // 3. Map Data
    if (options.map) {
      csvData.push(['SECTION', 'GEO-ANALYTICS - DISTRICT DATA']);
      csvData.push(['District', 'Conviction Rate (%)', 'NBW Executed', 'Ganja Seized (Kg)', 'Firearms Seized']);
      Object.keys(mapData).forEach(district => {
        const data = mapData[district] || {};
        csvData.push([
          district,
          data.conviction_rate || 0,
          data.nbw_executed || 0,
          data.narcotics_ganja_kg || 0,
          data.firearms_seized || 0
        ]);
      });
      csvData.push([]);
    }

    // 4. Summary
    if (options.summary) {
      csvData.push(['SECTION', 'AI MONTHLY SUMMARY']);
      const plainText = summary.replace(/<[^>]*>?/gm, ''); // Use the state 'summary'
      csvData.push(['Summary', plainText]);
      csvData.push([]);
    }

    // 5. Leaderboard
    if (options.leaderboard) {
      const metrics = [
        { key: 'narcotics_ganja_kg', name: 'Ganja Seized (Kg)' },
        { key: 'narcotics_brownsugar_gm', name: 'Brownsugar Seized (gm)' },
        { key: 'firearms_seized', name: 'Firearms Seized' },
        { key: 'sand_mining_cases', name: 'Sand Mining Cases' },
        { key: 'nbw_executed', name: 'NBW Executed' }
      ];

      for (const metric of metrics) {
        try {
          const leaderboardData = await api.getDriveLeaderboard(metric.key);
          csvData.push(['SECTION', `LEADERBOARD - ${metric.name.toUpperCase()}`]);
          csvData.push(['Rank', 'District', 'Value']);
          (leaderboardData || []).slice(0, 10).forEach((item, idx) => {
            csvData.push([idx + 1, item.district, item.value]);
          });
          csvData.push([]);
        } catch (err) {
          console.error(`Failed to fetch ${metric.key}:`, err);
        }
      }
    }

    // 6. District Spotlight
    if (options.spotlight) {
      csvData.push(['SECTION', 'DISTRICT PERFORMANCE SPOTLIGHT']);
      
      const topPride = [...convictionRates].sort((a, b) => b.rate - a.rate).slice(0, 3);
      const bottomPride = [...convictionRates].sort((a, b) => a.rate - b.rate).slice(0, 3);
      
      csvData.push(['Category', 'Rank', 'District', 'Conviction Rate (%)']);
      topPride.forEach((d, idx) => {
        csvData.push(['Top Performers', idx + 1, d.district, d.rate.toFixed(1)]);
      });
      bottomPride.forEach((d, idx) => {
        csvData.push(['Areas for Focus', idx + 1, d.district, d.rate.toFixed(1)]);
      });
      csvData.push([]);
    }

    // // 7. Officers
    // if (options.officers) {
    //   csvData.push(['SECTION', 'TOP PERFORMING OFFICERS']);
    //   csvData.push(['Note', 'Data will be populated when officer performance API is integrated']);
    //   csvData.push([]);
    // }

    // Generate CSV file
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `DGP-Dashboard-Report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- [NEW] --- PDF Generation Function ---
  const generatePDF = async (options, kpiData) => {
    // 1. Initialize the PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const docWidth = 210;
    const margin = 15;
    const contentWidth = docWidth - margin * 2;
    let yPos = margin;

    // Helper function to add a new page if needed
    const checkAndAddPage = (requiredHeight) => {
      if (yPos + requiredHeight > 280) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Helper to add section header
    const addSectionHeader = (title) => {
      checkAndAddPage(15);
      doc.setFillColor(102, 126, 234);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 2, yPos + 5.5);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    };

    // 2. Add document header
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, docWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('STATE COMMAND CENTER', margin, 15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('DGP Dashboard Report', margin, 23);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, margin, 30);
    doc.setTextColor(0, 0, 0);
    yPos = 45;

    // 3. KPI Stats Cards
    if (options.kpis) {
      addSectionHeader('KEY PERFORMANCE INDICATORS');
      
      const kpiItems = [
        { label: 'State Conviction Rate', value: kpiData.kpiConviction, subtitle: 'IPC/BNS Cases (This Month)', change: '+5.2%' },
        { label: 'Active AI Alerts', value: kpiData.kpiAlerts.toString(), subtitle: 'AI detected anomalies', change: '-2%' },
        { label: 'NBWs Executed', value: kpiData.kpiNbwExecuted.toString(), subtitle: 'This Month', change: '+15%' },
        { label: 'Firearms Seized', value: kpiData.kpiFirearmsSeized.toString(), subtitle: 'This Month', change: '+8%' }
      ];

      kpiItems.forEach((kpi, idx) => {
        if (idx % 2 === 0 && idx > 0) yPos += 25;
        checkAndAddPage(25);
        
        const xPos = idx % 2 === 0 ? margin : margin + contentWidth / 2 + 5;
        const boxWidth = contentWidth / 2 - 5;
        
        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(xPos, yPos, boxWidth, 22, 2, 2, 'FD');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(kpi.label, xPos + 3, yPos + 5);
        
        doc.setFontSize(8);
        doc.text(kpi.subtitle, xPos + 3, yPos + 9);
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(kpi.value, xPos + 3, yPos + 16);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const changeColor = kpi.change.startsWith('+') ? [34, 197, 94] : [239, 68, 68];
        doc.setTextColor(...changeColor);
        doc.text(kpi.change + ' vs last month', xPos + 3, yPos + 20);
        doc.setTextColor(0, 0, 0);
      });
      
      yPos += 30;
    }

    // 4. AI Performance Forecast
    if (options.alerts) {
      addSectionHeader('AI PERFORMANCE FORECAST - Districts to Watch');
      
      const currentAlerts = alerts.alerts || []; // Use .alerts property
      if (currentAlerts.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(156, 163, 175);
        doc.text('No threshold-based alerts triggered.', margin + 5, yPos + 5);
        yPos += 15;
      } else {
        currentAlerts.forEach((alert, idx) => {
          checkAndAddPage(15);
          
          const bgColor = alert.type === 'red' ? [254, 226, 226] : [220, 252, 231];
          const textColor = alert.type === 'red' ? [127, 29, 29] : [20, 83, 45];
          
          doc.setFillColor(...bgColor);
          doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...textColor);
          
          const lines = doc.splitTextToSize(alert.text, contentWidth - 10);
          lines.forEach((line, lineIdx) => {
            doc.text(line, margin + 5, yPos + 5 + (lineIdx * 4));
          });
          
          yPos += Math.max(12, lines.length * 4 + 3);
          doc.setTextColor(0, 0, 0);
        });
      }
      yPos += 5;
    }

    // 5. Map Data Summary
    if (options.map) {
      addSectionHeader('GEO-ANALYTICS SUMMARY - Top & Bottom Districts');
      
      const districtList = Object.keys(mapData);
      const topConviction = districtList
        .map(d => ({ name: d, rate: (mapData[d] || {}).conviction_rate || 0 }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5);
      
      const bottomConviction = districtList
        .map(d => ({ name: d, rate: (mapData[d] || {}).conviction_rate || 0 }))
        .sort((a, b) => a.rate - b.rate)
        .slice(0, 5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 5 Districts (Conviction Rate):', margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      topConviction.forEach((d, idx) => {
        checkAndAddPage(5);
        doc.text(`${idx + 1}. ${d.name}: ${d.rate.toFixed(1)}%`, margin + 5, yPos);
        yPos += 5;
      });
      
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Bottom 5 Districts (Conviction Rate):', margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      bottomConviction.forEach((d, idx) => {
        checkAndAddPage(5);
        doc.text(`${idx + 1}. ${d.name}: ${d.rate.toFixed(1)}%`, margin + 5, yPos);
        yPos += 5;
      });
      
      yPos += 5;
    }

    // 6. AI Monthly Summary
    if (options.summary) {
      addSectionHeader('AI MONTHLY SUMMARY (NLG)');
      
      const plainText = summary.replace(/<[^>]*>?/gm, ''); // Use state 'summary'
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(plainText, contentWidth);
      
      splitText.forEach((line) => {
        checkAndAddPage(6);
        doc.text(line, margin, yPos);
        yPos += 6;
      });
      
      yPos += 5;
    }

    // 7. Drive Leaderboard
    if (options.leaderboard) {
      addSectionHeader('SPECIAL DRIVE LEADERBOARD');
      
      const metrics = [
        { key: 'narcotics_ganja_kg', name: 'Ganja Seized (Kg)' },
        { key: 'narcotics_brownsugar_gm', name: 'Brownsugar Seized (gm)' },
        { key: 'firearms_seized', name: 'Firearms Seized' },
        { key: 'sand_mining_cases', name: 'Sand Mining Cases' },
        { key: 'nbw_executed', name: 'NBW Executed' }
      ];

      for (const metric of metrics) {
        try {
          const leaderboardData = await api.getDriveLeaderboard(metric.key);
          const top5 = (leaderboardData || []).slice(0, 5);
          
          checkAndAddPage(25);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(metric.name + ':', margin, yPos);
          yPos += 6;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          top5.forEach((item, idx) => {
            checkAndAddPage(5);
            doc.text(`${idx + 1}. ${item.district}: ${item.value}`, margin + 5, yPos);
            yPos += 5;
          });
          
          yPos += 3;
        } catch (err) {
          console.error(`Failed to fetch ${metric.key}:`, err);
        }
      }
      
      yPos += 5;
    }

    // 8. District Spotlight
    if (options.spotlight) {
      addSectionHeader('DISTRICT PERFORMANCE SPOTLIGHT');
      
      const topPride = [...convictionRates].sort((a, b) => b.rate - a.rate).slice(0, 3);
      const bottomPride = [...convictionRates].sort((a, b) => a.rate - b.rate).slice(0, 3);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('Top 3 (Conviction Rate):', margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      topPride.forEach((d, idx) => {
        checkAndAddPage(5);
        doc.text(`${idx + 1}. ${d.district}: ${d.rate.toFixed(1)}%`, margin + 5, yPos);
        yPos += 5;
      });
      
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(234, 179, 8);
      doc.text('Areas for Focus (Bottom 3):', margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      bottomPride.forEach((d, idx) => {
        checkAndAddPage(5);
        doc.text(`${idx + 1}. ${d.district}: ${d.rate.toFixed(1)}%`, margin + 5, yPos);
        yPos += 5;
      });
      
      yPos += 10;
    }

    // 9. Top Officers
    // if (options.officers) {
    //   addSectionHeader('TOP PERFORMING OFFICERS');
      
    //   doc.setFontSize(9);
    //   doc.setFont('helvetica', 'italic');
    //   doc.setTextColor(107, 114, 128);
    //   doc.text('Data will be populated when officer performance API is integrated.', margin + 5, yPos);
    //   yPos += 10;
    // }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        docWidth / 2,
        285,
        { align: 'center' }
      );
      doc.text(
        'State Command Center - Confidential',
        margin,
        285
      );
    }

    // Save the PDF
    doc.save(`DGP-Dashboard-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  
  const kpiConviction = convictionRates[0] ? convictionRates[0].rate.toFixed(1) + '%' : '0%';
  const kpiAlerts = (alerts && alerts.alerts) ? alerts.alerts.length : 0;
  const kpiNbwExecuted = nbwTotal;
  const kpiFirearmsSeized = firearmsTotal;

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen gradient-mesh">
      
      {/* --- [NEW] --- PDF Generation Loading Overlay --- */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[100]">
          <div className="text-center text-white">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto" />
            <p className="text-xl font-semibold mt-4">Generating Report...</p>
            <p className="text-sm">This may take a moment.</p>
          </div>
        </div>
      )}

      {/* --- Style block from Master --- */}
      <style>{`
        /* --- Your exact styling (Unchanged) --- */
        .gradient-mesh {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: cover;
          background-attachment: fixed;
        }
        .gradient-mesh::before {
          content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.95) 0%, 
            rgba(224, 242, 254, 0.95) 25%,
            rgba(224, 231, 255, 0.95) 50%,
            rgba(219, 234, 254, 0.95) 100%);
          z-index: -1;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        .glass-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px 0 rgba(31, 38, 135, 0.25);
        }
        .gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .gradient-blue { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); }
        .gradient-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .gradient-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        .gradient-danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        .gradient-info { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .float-animation { animation: float 4s ease-in-out infinite; }
        .ticker { animation: ticker 0.6s ease-out; }
        @keyframes ticker { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-reverse { animation-direction: reverse; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      
      {/* --- [UPDATED] --- Header now has export button logic --- */}
      <header className="glass-card border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 gradient-primary rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  State Command Center
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <Globe className="w-3 h-3" />
                  Director General Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsPdfModalOpen(true)}
                className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
                disabled={isGeneratingPdf} // Disable while generating
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button
                onClick={handleRefresh}
                className={`px-4 py-2 gradient-primary text-white rounded-xl shadow-lg text-sm font-medium hover:shadow-xl transition-all flex items-center gap-2 ${refreshing ? 'opacity-75' : ''}`}
                disabled={refreshing || isGeneratingPdf} // Disable while generating
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* StatsCards (From Master) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="State Conviction Rate"
            value={kpiConviction}
            change={5.2} // Mock change
            subtitle="IPC/BNS Cases (This Month)"
            icon={<CheckCircle />}
            color="gradient-success"
            delay={0}
          />
          <StatsCard
            title="Active AI Alerts"
            value={kpiAlerts}
            change={-2} // Mock change
            subtitle="AI detected anomalies"
            icon={<Bell />}
            color="gradient-danger"
            delay={100}
          />
           <StatsCard
            title="NBWs Executed"
            value={kpiNbwExecuted}
            change={15} // Mock change
            subtitle="This Month"
            icon={<UserCheck />}
            color="gradient-blue"
            delay={200}
          />
          <StatsCard
            title="Firearms Seized"
            value={kpiFirearmsSeized}
            change={8} // Mock change
            subtitle="This Month"
            icon={<Target />}
            color="gradient-warning"
            delay={300}
          />
        </div>
        
        {/* AI Smart Alerts (From Master) */}
        <AiForecastWidget
          alerts={alerts.alerts}
          diagnostics={alerts.diagnostics}
          summary={alerts.summary}
        />

        
        {/* Row 2: Geo-Map (Updated) and AI Summary (From Master) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <GeoAnalyticsWidget
            mapData={mapData}
          />
          <AiSummaryWidget summary={summary} />
        </div>

        {/* Row 3: Special Drive Leaderboards (From Master) */}
        <div className="mt-6">
          <DriveLeaderboardWidget />
        </div>
        
        {/* Row 4: Trend Analysis (From Master) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <TrendAnalysisWidget />
          <TopDistrictsWidget />
        </div>

        {/* Row 5: District Performance & Top Officers (From Master) */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
          <DistrictSpotlightWidget
            prideData={convictionRates.map(c => ({ district: c.district, score: c.rate }))} // Use conviction rates for pride
            workloadData={[]} // You need to fetch and pass workloadData here
          />
          {/* <TopOfficersWidget data={[]} /> You need to fetch and pass topOfficers here */}
        </div>

      </div>

      {/* --- [NEW] --- Render the modal at the end --- */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onExport={handleExportPdf}
      />
    </div>
  );
}

export default DGPDashboard;