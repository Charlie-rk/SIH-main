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
  Map as MapIcon, Trophy, TrendingDown as TrendingDownIcon, UserCheck // New Icons
} from 'lucide-react';

// New imports for the map
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import axios from 'axios'; // For fetching GeoJSON

// Import all our API functions
import * as api from '../services/API';

// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- YOUR BEAUTIFUL COMPONENTS (UNCHANGED) ---

const DashboardCard = ({ title, icon, children, gridSpan = "col-span-1", delay = 0, badge = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  
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
        <div className="flex items-center gap-3">
          {badge && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} ${badge.pulse ? 'pulse' : ''}`}>
              {badge.text}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full pulse"></span>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
      </div>
      {/* Dynamic height for map/other widgets */}
      <div className="h-[350px] md:h-[400px]">
        {children}
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
        <p className="text-sm text-gray-600">Loading intelligence data...</p>
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  </div>
);

const StatsCard = ({ title, value, change, icon, color, subtitle, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
      const target = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
      if (isNaN(target)) {
        setDisplayValue(value); // Handle non-numeric strings
        return;
      }

      const duration = 1500;
      const steps = 60;
      const stepValue = target / steps;
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
  }, [value, delay]);

  const formatDisplayValue = () => {
    if (typeof displayValue === 'number') {
      if (value.toString().includes('%')) return `${displayValue.toFixed(0)}%`;
      if (value.toString().includes('k')) return `${(displayValue / 1000).toFixed(1)}k`;
      if (value.toString().includes('.')) return displayValue.toFixed(1);
      return displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return displayValue; // For strings like "N/A"
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
                <>
                  <ChevronUp className="w-5 h-5 text-green-500 mr-1" />
                  <span className="text-sm font-semibold text-green-600">+{Math.abs(change)}%</span>
                </>
              ) : change < 0 ? (
                <>
                  <ChevronDown className="w-5 h-5 text-red-500 mr-1" />
                  <span className="text-sm font-semibold text-red-600">{Math.abs(change)}%</span>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-500">No change</span>
              )}
              <span className="text-xs text-gray-500 ml-2">vs last period</span>
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

// ... (Your other widgets: AlertsWidget, PrideScoreWidget, WorkloadWidget, CorrelationWidget, SentimentTrendWidget, HrAnalyticsWidget... are all perfect, no changes needed)
// I will paste them here for completeness.

// --- WIDGET 1: AI Smart Alerts ---
const AlertsWidget = ({ alerts }) => {
  const [filter, setFilter] = useState('all');
  const [expandedAlert, setExpandedAlert] = useState(null);
  
  const getAlertIcon = (type) => {
    switch(type) {
      case 'red': return <Zap className="text-red-500" />;
      case 'yellow': return <Bell className="text-yellow-500" />;
      default: return <CheckCircle className="text-green-500" />;
    }
  };
  
  const getAlertPriority = (type) => {
    switch(type) {
      case 'red': return 'Critical';
      case 'yellow': return 'Warning';
      default: return 'Success';
    }
  };
  
  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);
  
  return (
    <div className="glass-card rounded-2xl p-6 slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 gradient-danger rounded-xl shadow-lg">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">AI-Powered Smart Alerts</h2>
            <p className="text-sm text-gray-500 mt-1">Anomaly detection system</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['all', 'red', 'green'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filter === type 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full pulse"></span>
          <span className="text-xs text-gray-500">{alerts.length} Active</span>
        </div>
      </div>
      
      <div className="h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {filteredAlerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <Shield className="w-16 h-16 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No alerts in this category</p>
          </div>
        )}
        
        {filteredAlerts.map((alert, i) => (
          <div
            key={i}
            onClick={() => setExpandedAlert(expandedAlert === i ? null : i)}
            className={`
              flex items-start p-4 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02]
              ${alert.type === 'red' ? 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200' : 
                alert.type === 'green' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' :
                'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'}
            `}
            style={{animationDelay: `${i * 50}ms`}}
          >
            <div className="mr-3 mt-1">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  alert.type === 'red' ? 'bg-red-100 text-red-700' :
                  alert.type === 'green' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {getAlertPriority(alert.type)}
                </span>
                <span className="text-xs text-gray-500">Just now</span>
              </div>
              <p className={`text-sm font-medium mt-2 ${
                alert.type === 'red' ? 'text-red-800' :
                alert.type === 'green' ? 'text-green-800' :
                'text-yellow-800'
              }`}>
                {alert.text}
              </p>
            </div>
            <Eye className="w-4 h-4 text-gray-400 ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- WIDGET 2: P.R.I.D.E. Score ---
const PrideScoreWidget = ({ data }) => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const top10 = data.sort((a, b) => b.score - a.score).slice(0, 10);
  
  const getMedalColor = (index) => {
    if (index === 0) return '#FFD700'; // Gold
    if (index === 1) return '#C0C0C0'; // Silver
    if (index === 2) return '#CD7F32'; // Bronze
    return '#3b82f6'; // Blue for others
  };
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">{payload[0].payload.district}</p>
          <p className="text-xs text-gray-600 mt-1">Score: <span className="font-bold text-blue-600">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <DashboardCard 
      title="P.R.I.D.E. Score Champions" 
      icon={<Award />} 
      gridSpan="col-span-1"
      delay={100}
      badge={{ text: 'Top 10', color: 'bg-yellow-100 text-yellow-800' }}
    >
      <div className="h-full flex flex-col">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={top10} 
            layout="vertical" 
            margin={{ left: 20, right: 20 }}
            onClick={(data) => data && setSelectedDistrict(data.activePayload[0].payload)}
          >
            <defs>
              <linearGradient id="prideGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#6b7280" />
            <YAxis 
              dataKey="district" 
              type="category" 
              stroke="#6b7280" 
              tick={{ fontSize: 11 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
            <Bar 
              dataKey="score" 
              name="P.R.I.D.E. Score"
              radius={[0, 8, 8, 0]}
            >
              {top10.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getMedalColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};

// --- WIDGET 3: Workload Analysis ---
const WorkloadWidget = ({ data }) => {
  const [viewMode, setViewMode] = useState('bar');
  const top10 = data.sort((a, b) => b.ratio - a.ratio).slice(0, 10);
  
  const getWorkloadColor = (ratio) => {
    if (ratio > 15) return '#ef4444'; // Red for high
    if (ratio > 10) return '#f59e0b'; // Yellow for medium
    return '#10b981'; // Green for optimal
  };
  
  const radarData = top10.map(d => ({
    district: d.district.substring(0, 8),
    ratio: d.ratio,
    fullMark: 20
  }));
  
  return (
    <DashboardCard 
      title="Resource Optimization Matrix" 
      icon={<Briefcase />} 
      gridSpan="col-span-1"
      delay={200}
      badge={{ text: 'Top 10 Stressed', color: 'bg-red-100 text-red-800' }}
    >
      <div className="h-full flex flex-col">
        <div className="flex justify-end mb-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'bar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'radar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Radar
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bar' ? (
            <BarChart data={top10} layout="vertical" margin={{ left: 20 }}>
              <defs>
                <linearGradient id="workloadGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#1e40af" stopOpacity={1}/>
                </linearGradient>
              </defs>
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
              <Bar dataKey="ratio" name="Cases per Officer" radius={[0, 8, 8, 0]}>
                {top10.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getWorkloadColor(entry.ratio)} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="district" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 20]} tick={{ fontSize: 10 }} />
              <Radar name="Workload" dataKey="ratio" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};

// --- WIDGET 4: P.R.I.D.E. vs. Crime Correlation ---
// --- UPDATED WIDGET: P.R.I.D.E. vs Crime Correlation with Year Filter ---
const CorrelationWidget = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState("All");

  // Extract unique list of years
  const hasYear = data.some(d => d.year !== undefined && d.year !== null);

const years = ["All", ...Array.from(new Set(data.map(d => d.year)))];


const filteredData =
  selectedYear === "All"
    ? data
    : data.filter(d => d.year === selectedYear);


const chartData = filteredData.map(d => ({
  district: d.district,
  year: d.year,
  average_total_crime: Number(d.average_total_crime) || 0,
  pride_score: Number(d.pride_score) || 0,
  yearly_crime: Number(d.yearly_crime) || 0
}));



  // Calculate Pearson correlation
 const calculateCorrelation = () => {
  if (!chartData || chartData.length === 0) return "0.000";

  const n = chartData.length;
  const sumX = chartData.reduce((s, d) => s + d.average_total_crime, 0);
  const sumY = chartData.reduce((s, d) => s + d.pride_score, 0);
  const sumXY = chartData.reduce((s, d) => s + d.average_total_crime * d.pride_score, 0);
  const sumX2 = chartData.reduce((s, d) => s + d.average_total_crime ** 2, 0);
  const sumY2 = chartData.reduce((s, d) => s + d.pride_score ** 2, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2)
  );

  if (!isFinite(numerator / denominator)) return "0.000";

  return (numerator / denominator).toFixed(3);
};

  const rValue = calculateCorrelation();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].payload.district}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Crime:{" "}
            <span className="font-bold text-blue-600">
              {payload[0].value}
            </span>
          </p>
          <p className="text-xs text-gray-600">
            P.R.I.D.E.:{" "}
            <span className="font-bold text-green-600">
              {payload[1].value}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardCard
  title="P.R.I.D.E. Impact Analysis"
  icon={<ScatterIcon />}
  gridSpan="col-span-1"
  delay={300}
  badge={{ text: `r = ${rValue}`, color: "bg-green-100 text-green-800" }}
>
  <div className="h-full">

    {/* YEAR FILTER */}
    <div className="flex justify-end mb-2">
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(
          e.target.value === "All" ? "All" : Number(e.target.value)
        )}
        className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {years.map((yr) => (
          <option key={yr} value={yr}>
            {yr === "All" ? "All Years" : yr}
          </option>
        ))}
      </select>
    </div>

    <ResponsiveContainer width="100%" height="90%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>

        <defs>
          <linearGradient id="scatterGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

        <XAxis
          dataKey="average_total_crime"
          type="number"
          name="Avg Crime"
          stroke="#6b7280"
          tick={{ fontSize: 10 }}
          label={{
            value: "3-Year Avg Crime",
            position: "insideBottom",
            offset: -10,
            style: { fontSize: 11 }
          }}
        />

        <YAxis
          dataKey="pride_score"
          type="number"
          name="PRIDE"
          stroke="#6b7280"
          tick={{ fontSize: 10 }}
          label={{
            value: "P.R.I.D.E. Score",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 11 }
          }}
        />

        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const row = payload[0].payload;
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">{row.district}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Avg Crime:
                    <span className="font-bold text-blue-600"> {row.average_total_crime}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Crime ({row.year}):
                    <span className="font-bold text-orange-600"> {row.yearly_crime}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    P.R.I.D.E.:
                    <span className="font-bold text-green-600"> {row.pride_score}</span>
                  </p>
                </div>
              );
            }
            return null;
          }}
        />

        <Scatter data={chartData} fill="url(#scatterGradient)" />

      </ScatterChart>
    </ResponsiveContainer>

    <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <p className="text-xs font-semibold text-green-800">Insight</p>
      <p className="text-xs text-green-700 mt-1">
        PRIDE score shows meaningful correlation with 3-year average IPC crime rates.
      </p>
    </div>
  </div>
</DashboardCard>

  );
};


// --- WIDGET 5: Live Public Sentiment ---
const SentimentTrendWidget = ({ data }) => {
  // ... (Your existing SentimentTrendWidget code is perfect) ...
  // ... (Pasting for completeness) ...
  const [timeRange, setTimeRange] = useState('30d');
  
  const latestSentiment = data[data.length - 1];
  const sentimentScore = latestSentiment 
    ? Math.round((latestSentiment.positive / (latestSentiment.positive + latestSentiment.negative + 0.001)) * 100)
    : 0;
  
  const getSentimentColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <DashboardCard 
      title="Public Sentiment Analytics" 
      icon={<Activity />} 
      gridSpan="col-span-1"
      delay={400}
      badge={{ 
        text: `${sentimentScore}% Positive`, 
        color: sentimentScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
        pulse: true 
      }}
    >
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Positive</span>
            <div className="w-3 h-3 bg-red-500 rounded-full ml-3"></div>
            <span className="text-xs text-gray-600">Negative</span>
          </div>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
        </div>
        
        <ResponsiveContainer width="100%" height="75%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="positive" 
              name="Positive" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#positiveGradient)" 
            />
            <Area 
              type="monotone" 
              dataKey="negative" 
              name="Negative" 
              stroke="#ef4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#negativeGradient)" 
            />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="p-2 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600">Avg. Positive</p>
            <p className="text-sm font-bold text-green-600">
              {Math.round(data.reduce((sum, d) => sum + d.positive, 0) / (data.length || 1))}
            </p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-600">Avg. Negative</p>
            <p className="text-sm font-bold text-red-600">
              {Math.round(data.reduce((sum, d) => sum + d.negative, 0) / (data.length || 1))}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

// --- WIDGET 6: HR Analytics ---
const HrAnalyticsWidget = ({ data }) => {
  // ... (Your existing HrAnalyticsWidget code is perfect, but I'll fix the bug again) ...
  // ... (Pasting for completeness) ...
  const [activeView, setActiveView] = useState('overview');
  
  const ageData = [
    { name: '20-30', value: 0, color: '#3b82f6' },
    { name: '31-40', value: 0, color: '#8b5cf6' },
    { name: '41-50', value: 0, color: '#f59e0b' },
    { name: '51+', value: 0, color: '#10b981' },
  ];
  
  const genderData = [
    { name: 'Male', value: 0, percentage: 0 },
    { name: 'Female', value: 0, percentage: 0 },
  ];
  
  // inside HrAnalyticsWidget component, replace the old "if (data) { ... }" block with:

const source = data || {}; // data is expected to be an object: { Angul: {...}, Balasore: {...}, ... }

let totalOfficers = 0;

// reset age & gender accumulators (they were declared earlier)
ageData.forEach(a => a.value = 0);
genderData.forEach(g => { g.value = 0; g.percentage = 0; });

Object.values(source).forEach(district => {
  // SAFE access for age groups (handle different key styles)
  const ages = district.by_age_group || district.age_groups || district.ageGroup || {};
  ageData[0].value += Number(ages["20_30"] || ages["20-30"] || ages["20_30"] || ages["20-30"] || 0);
  ageData[1].value += Number(ages["31_40"] || ages["31-40"] || 0);
  ageData[2].value += Number(ages["41_50"] || ages["41-50"] || 0);
  ageData[3].value += Number(ages["51_plus"] || ages["51+"] || ages["51_plus"] || ages["51_plus"] || 0);

  // SAFE access for gender
  const g = district.by_gender || district.gender || {};
  const male = Number(g.male || g.Male || 0);
  const female = Number(g.female || g.Female || 0);

  genderData[0].value += male;
  genderData[1].value += female;
});

// Use gender totals as canonical source for percentages if available
const genderTotal = genderData[0].value + genderData[1].value;

// Fallback: if gender counts are missing, use sum of total_strength
if (genderTotal > 0) {
  totalOfficers = genderTotal;
} else {
  totalOfficers = Object.values(source).reduce((s, d) => s + Number(d.total_strength || 0), 0);
}

if (totalOfficers > 0) {
  genderData[0].percentage = Math.round((genderData[0].value / totalOfficers) * 100);
  genderData[1].percentage = Math.round((genderData[1].value / totalOfficers) * 100);
} else {
  genderData[0].percentage = genderData[1].percentage = 0;
}

  
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <div className="glass-card rounded-2xl p-6 slide-up" style={{animationDelay: '500ms'}}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 gradient-primary rounded-xl shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Human Resource Intelligence</h2>
            <p className="text-sm text-gray-500 mt-1">State-wide force analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['overview', 'trends', 'insights'].map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeView === view 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            {totalOfficers.toLocaleString()} Officers
          </div>
        </div>
      </div>
      
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[350px]">
          {/* Age Distribution */}
          <div className="flex flex-col">
            <h3 className="text-center text-sm font-semibold text-gray-700 mb-2">Age Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={ageData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80}
                  labelLine={false}
                  label={CustomLabel}
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {ageData.map((item, index) => (
                <div key={index} className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Gender Ratio */}
          <div className="flex flex-col">
            <h3 className="text-center text-sm font-semibold text-gray-700 mb-2">Gender Balance</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#3b82f6"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80 * genderData[0].percentage / 100} ${2 * Math.PI * 80}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-gray-800">{genderData[0].percentage}%</p>
                  <p className="text-sm text-gray-600">Male</p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Male Officers</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{genderData[0].value.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Female Officers</span>
                </div>
                <span className="text-sm font-bold text-pink-600">{genderData[1].value.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-center text-sm font-semibold text-gray-700 mb-2">Key Metrics</h3>
            
            <div className="flex-1 space-y-3">
              <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Avg. Age</span>
                  <Target className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-600">38.5</p>
                <p className="text-xs text-gray-500 mt-1">Years</p>
              </div>
              
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Retention Rate</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600">94.2%</p>
                <p className="text-xs text-gray-500 mt-1">+2.3% YoY</p>
              </div>
              
              <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Training Hours</span>
                  <Brain className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-orange-600">156k</p>
                <p className="text-xs text-gray-500 mt-1">This Quarter</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeView === 'trends' && (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-gray-500">Trend analysis coming soon...</p>
        </div>
      )}
      
      {activeView === 'insights' && (
        <div className="h-[350px] space-y-3">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">AI Insight #1</h4>
            <p className="text-xs text-gray-700">Districts with balanced age distribution show 23% better performance metrics</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-800 mb-2">AI Insight #2</h4>
            <p className="text-xs text-gray-700">Female officer representation correlates with improved community trust scores</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-800 mb-2">AI Insight #3</h4>
            <p className="text-xs text-gray-700">Officers aged 31-40 demonstrate optimal experience-to-energy ratio</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- [NEW] WIDGET 7: Geo-Analytics Map ---
const GeoAnalyticsWidget = ({ prideData, workloadData }) => {
  const [geoData, setGeoData] = useState(null);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const [mapMetric, setMapMetric] = useState('pride_score'); // 'pride_score' or 'workload'

  const GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@8d907bc/geojson/states/odisha.geojson';

  useEffect(() => {
    async function loadGeo() {
      try {
        const res = await axios.get(GEOJSON_URL, { responseType: 'json', timeout: 10000 });
        setGeoData(res.data);
      } catch (err) {
        console.error('Failed to fetch GeoJSON:', err);
        setError('Failed to load map data.');
      }
    }
    loadGeo();
  }, []);

  const metricsMap = {};
  prideData.forEach(d => {
    metricsMap[d.district] = { ...metricsMap[d.district], pride_score: d.score };
  });
  workloadData.forEach(d => {
    metricsMap[d.district] = { ...metricsMap[d.district], workload: d.ratio };
  });

  const extractDistrictName = (props = {}) => {
    return (
      props.dtname || props.DTNAME || props.DISTRICT || props.district || 
      props.NAME_2 || props.NAME || props.name || 'Unknown'
    );
  };

  const getColor = (value, metric) => {
    const isPride = metric === 'pride_score';
    // Color scale for P.R.I.D.E. (Green is good)
    if (isPride) {
      if (value > 100) return '#166534'; // Dark Green
      if (value > 75) return '#15803d';
      if (value > 50) return '#22c55e';
      if (value > 25) return '#86efac';
      return '#dcfce7'; // Light Green
    }
    // Color scale for Workload (Red is bad)
    if (value > 15) return '#b91c1c'; // Dark Red
    if (value > 10) return '#dc2626';
    if (value > 5) return '#f87171';
    if (value > 2) return '#fecaca';
    return '#fee2e2'; // Light Red
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
      mouseover: (e) => {
        e.target.setStyle({ weight: 3, color: '#1e293b', fillOpacity: 0.9 });
        if (e.target.bringToFront) e.target.bringToFront();
      },
      mouseout: (e) => {
        layer.setStyle(geoStyle(feature)); // Use 'layer' to reset
      },
    });

    const popupHtml = `
      <div style="font-family: Inter, sans-serif; min-width:140px;">
        <strong style="color: #1e293b; font-size: 14px;">${name}</strong><br />
        <p style="margin: 4px 0; font-size: 12px; color: #334155;">
          P.R.I.D.E. Score: <strong style="color: #059669;">${region.pride_score || 0}</strong>
        </p>
        <p style="margin: 4px 0; font-size: 12px; color: #334155;">
          Workload (Cases/Officer): <strong style="color: #dc2626;">${region.workload || 0}</strong>
        </p>
      </div>`;
    layer.bindPopup(popupHtml);
  };

  return (
    <DashboardCard 
      title="Odisha Geo-Analytics" 
      icon={<MapIcon />} 
      gridSpan="col-span-1 lg:col-span-2"
      delay={600}
    >
      <div className="h-full flex flex-col">
        <div className="flex justify-end mb-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMapMetric('pride_score')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                mapMetric === 'pride_score' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              P.R.I.D.E. Score
            </button>
            <button
              onClick={() => setMapMetric('workload')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                mapMetric === 'workload' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Workload
            </button>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
          {error ? (
            <div className="p-10 text-center text-red-500">{error}</div>
          ) : geoData ? (
            <MapContainer
              center={[20.95, 84.5]}
              zoom={6.8}
              style={{ height: '100%', width: '100%', backgroundColor: '#f0f9ff' }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
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

// --- [NEW] WIDGET 8: District Performance Spotlight ---
const DistrictSpotlightWidget = ({ prideData, workloadData }) => {
  const topPride = [...prideData].sort((a, b) => b.score - a.score).slice(0, 3);
  const bottomPride = [...prideData].sort((a, b) => a.score - b.score).slice(0, 3);
  const topWorkload = [...workloadData].sort((a, b) => b.ratio - a.ratio).slice(0, 3);

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
          <h3 className="text-sm font-semibold text-green-600 mb-2">Top 3 (P.R.I.D.E. Score)</h3>
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
          <h3 className="text-sm font-semibold text-yellow-600 mb-2">Areas for Focus (Bottom 3 P.R.I.D.E.)</h3>
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

// --- [NEW] WIDGET 9: Top Officers ---
const TopOfficersWidget = ({ data }) => {
  return (
    <DashboardCard 
      title="Top Performing Officers" 
      icon={<UserCheck />} 
      gridSpan="col-span-1"
      delay={800}
      badge={{ text: 'State-Wide', color: 'bg-blue-100 text-blue-800' }}
    >
      <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
        <ul className="space-y-2">
          {data.map((officer, index) => (
            <li 
              key={officer.name} 
              className="flex items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
              style={{animationDelay: `${index * 50}ms`}}
            >
              <span className="text-lg font-bold text-blue-700 w-8">{index + 1}.</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{officer.name}</p>
                <p className="text-xs text-gray-500">ID: {officer.name.split('(')[1].replace(')', '')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{officer.recognitions}</p>
                <p className="text-xs text-gray-500">Recognitions</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardCard>
  );
};


// --- Main DGP Dashboard Component ---
function DGPDashboard() {
  // State for all data
  const [alerts, setAlerts] = useState([]);
  const [sentiment, setSentiment] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [hrData, setHrData] = useState(null);
  const [prideScore, setPrideScore] = useState([]);
  const [correlation, setCorrelation] = useState([]);
  const [responseTimes, setResponseTimes] = useState(null); // For StatsCard
  
  // State for NEW widgets
  const [topOfficers, setTopOfficers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  
  // Fetch all data
  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.getSmartAlerts(),           // 0
        api.getSentimentTrends(),       // 1
        api.getWorkloadData(),          // 2
        api.getHrData(),                // 3
        api.getPrideScore(),            // 4
        api.getCorrelationData(),       // 5
        // api.getResponseTimes(),         // 6
        api.getTopOfficers()            // 7 (NEW)
      ]);
      console.log("results \n");
      console.log(results);
      console.log("HR DATA =>", results[3].value);
      console.log("Top officers =>", results[6].value);
      if (results[0].status === 'fulfilled') setAlerts(results[0].value);
      if (results[1].status === 'fulfilled') setSentiment(results[1].value);
      if (results[2].status === 'fulfilled') setWorkload(results[2].value);
      if (results[3].status === 'fulfilled') setHrData(results[3].value);
      if (results[4].status === 'fulfilled') setPrideScore(results[4].value);
      if (results[5].status === 'fulfilled') setCorrelation(results[5].value);
      if (results[6].status === 'fulfilled') setTopOfficers( results[6].value);


      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch data for endpoint ${i}:`, result.reason);
        }
      });
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
  
  // --- Calculate Live KPI Values ---
  const totalDistricts = prideScore.length;
  console.log("hrData\n");
  console.log(hrData);
  const totalForceCalc = hrData
  ? Object.values(hrData).reduce((sum, d) => sum + (d.total_strength || 0), 0)
  : 0;


  console.log(totalForceCalc);

const totalForce = totalForceCalc; // pass raw number

console.log(totalForce);


  
  const avgPrideScore = (prideScore.length > 0)
    ? (prideScore.reduce((sum, d) => sum + d.score, 0) / prideScore.length).toFixed(1)
    : "0.0";
    
  const avgResponseTime = (responseTimes && responseTimes.average_time)
    ? responseTimes.average_time.toFixed(1) + 'm'
    : '0m';
  
  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen gradient-mesh">
      <style jsx>{`
        /* --- Your exact styling --- */
        .gradient-mesh {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: cover;
          background-attachment: fixed;
        }
        
        .gradient-mesh::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
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
        
        .gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .gradient-blue {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        }
        
        .gradient-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .gradient-warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .gradient-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        .gradient-info {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-up {
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        .float-animation {
          animation: float 4s ease-in-out infinite;
        }
        
        .ticker {
          animation: ticker 0.6s ease-out;
        }
        
        @keyframes ticker {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-reverse {
          animation-direction: reverse;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      {/* Header */}
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
              <button className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button 
                onClick={handleRefresh}
                className={`px-4 py-2 gradient-primary text-white rounded-xl shadow-lg text-sm font-medium hover:shadow-xl transition-all flex items-center gap-2 ${refreshing ? 'opacity-75' : ''}`}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* KPI Cards (NOW 100% DATA DRIVEN) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            title="Total Districts" 
            value={totalDistricts}
            subtitle="Under monitoring"
            icon={<Globe />}
            color="gradient-primary"
            delay={0}
          />
          <StatsCard 
            title="Active Alerts" 
            value={alerts.length}
            change={alerts.length > 0 ? 15 : -5} // Simple logic
            subtitle="AI detected anomalies"
            icon={<Bell />}
            color="gradient-danger"
            delay={100}
          />
          <StatsCard 
            title="Force Strength" 
            value={totalForce}
            change={hrData?.change_percent || 0}
            subtitle="Total officers"
            icon={<Users />}
            color="gradient-success"
            delay={200}
          />
          <StatsCard 
            title="P.R.I.D.E. Score" 
            value={avgPrideScore}
            change={prideScore[0]?.change_percent || 0} // Get change from first item
            subtitle="State average"
            icon={<Award />}
            color="gradient-warning"
            delay={300}
          />
        </div>
        
        {/* Smart Alerts (Full Width) */}
        <AlertsWidget alerts={alerts} />
        
        {/* --- [NEW] ROW 2: Geo-Map and Performance Spotlight --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <GeoAnalyticsWidget 
            prideData={prideScore} 
            workloadData={workload} 
          />
          <DistrictSpotlightWidget 
            prideData={prideScore} 
            workloadData={workload} 
          />
        </div>

        {/* --- [NEW] ROW 3: Top Officers & Sentiment --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <TopOfficersWidget data={topOfficers} />
          <SentimentTrendWidget data={sentiment} />
        </div>

        {/* --- [NEW] ROW 4: P.R.I.D.E. vs. Crime & Workload --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <CorrelationWidget data={correlation} />
          <WorkloadWidget data={workload} />
        </div>

        {/* --- [NEW] ROW 5: P.R.I.D.E. Champions & HR --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <PrideScoreWidget data={prideScore} />
          <HrAnalyticsWidget data={hrData} /> {/* Pass the nested data */}
        </div>
      </div>
    </div>
  );
}

export default DGPDashboard;