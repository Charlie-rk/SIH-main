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
  Truck, Search, Waves
} from 'lucide-react';

// New imports for the map
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import axios from 'axios'; // For fetching GeoJSON

// Import all our NEW API functions
// --- FIX 1: Make sure the path is correct (mine was lowercase) ---
import * as api from '../services/API'; 
import { useAuth } from '../context/AuthContext'; // To get user info

// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- REUSABLE UI COMPONENTS (Your beautiful style - UNCHANGED) ---
const DashboardCard = ({ title, icon, children, gridSpan = "col-span-1", delay = 0, badge = null, height = "h-[400px]" }) => {
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
        {badge && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} ${badge.pulse ? 'pulse' : ''}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className={height}>
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
      const target = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
      if (isNaN(target)) {
        setDisplayValue(value);
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
      if (value.toString().includes('%')) return `${displayValue.toFixed(1)}%`;
      if (value.toString().includes('k')) return `${(displayValue / 1000).toFixed(1)}k`;
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

// --- WIDGET 1: AI Smart Alerts (Forecast) ---
// ... (Your AiForecastWidget component code is perfect, no changes needed) ...
const AiForecastWidget = ({ alerts }) => (
  <div className="glass-card rounded-2xl p-6 slide-up">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-3 gradient-danger rounded-xl shadow-lg">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">AI Performance Forecast</h2>
          <p className="text-sm text-gray-500 mt-1">"Districts to Watch" (Pendency)</p>
        </div>
      </div>
    </div>
    <div className="h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
      {alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full">
          <Shield className="w-16 h-16 text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No significant trends detected.</p>
        </div>
      )}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start p-4 rounded-xl ${
            alert.type === 'red' ? 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200' : 
            'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
          }`}
        >
          <div className="mr-3 mt-1">
            {alert.type === 'red' ? <TrendingUp className="text-red-500" /> : <TrendingDownIcon className="text-green-500" />}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${alert.type === 'red' ? 'text-red-800' : 'text-green-800'}`}>
              {alert.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- WIDGET 2: AI Monthly Summary (NLG) ---
// ... (Your AiSummaryWidget component code is perfect, no changes needed) ...
const AiSummaryWidget = ({ summary }) => (
  <DashboardCard title="AI Monthly Summary (NLG)" icon={<Brain />} delay={100} height="h-[300px]">
    <div className="h-full flex flex-col justify-center">
      <p className="text-lg text-gray-700 leading-relaxed"
         dangerouslySetInnerHTML={{ __html: summary || "Generating summary..." }}
      />
    </div>
  </DashboardCard>
);

// --- WIDGET 3: Special Drive Leaderboard (Gamification) ---
// ... (Your DriveLeaderboardWidget component code is perfect, no changes needed) ...
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
  }, [metric]); // Refetch when metric changes

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
          <ResponsiveContainer width="100%" height="100%">
            {loading ? <p className="text-gray-400">Loading...</p> : (
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
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
};

// --- WIDGET 4: Geo-Analytics Map (GIS) ---
// ... (Your GeoAnalyticsWidget component code is perfect, no changes needed) ...
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
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setMapMetric('conviction_rate')} className={`px-3 py-1 rounded-md text-xs font-medium ${mapMetric === 'conviction_rate' ? 'bg-white shadow-sm' : 'text-gray-600'}`}>Conviction</button>
            <button onClick={() => setMapMetric('nbw_executed')} className={`px-3 py-1 rounded-md text-xs font-medium ${mapMetric === 'nbw_executed' ? 'bg-white shadow-sm' : 'text-gray-600'}`}>NBW</button>
            <button onClick={() => setMapMetric('narcotics_ganja_kg')} className={`px-3 py-1 rounded-md text-xs font-medium ${mapMetric === 'narcotics_ganja_kg' ? 'bg-white shadow-sm' : 'text-gray-600'}`}>Ganja</button>
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


// --- [NEW] WIDGET 8: District Performance Spotlight (No change) ---
const DistrictSpotlightWidget = ({ prideData, workloadData }) => {
  // --- FIX: Add safety check for empty arrays ---
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

// --- [NEW] WIDGET 9: Top Officers (No change) ---
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
  const { user } = useAuth();
  
  // State for all data
  const [summary, setSummary] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [convictionRates, setConvictionRates] = useState([]);
  const [mapData, setMapData] = useState({});
  const [topOfficers, setTopOfficers] = useState([]);
  const [workload, setWorkload] = useState([]);
  
  // --- FIX 2: Add state for the new data ---
  const [nbwTotal, setNbwTotal] = useState(0);
  const [firearmsTotal, setFirearmsTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch all data
  const fetchData = async () => {
    try {
      // --- FIX 3: Add new API calls to the fetch ---
      const results = await Promise.allSettled([
        api.getMonthlySummary(),        // 0
        api.getPerformanceForecast(),   // 1
        api.getConvictionRates(),     // 2
        api.getMapData(),               // 3
        api.getDriveLeaderboard('nbw_executed'),    // 4
        api.getDriveLeaderboard('firearms_seized')  // 5
        // Add more calls here as needed
      ]);
      
      // --- FIX 4: Set the new state variables ---
      if (results[0].status === 'fulfilled') setSummary(results[0].value.summary);
      if (results[1].status === 'fulfilled') setAlerts(results[1].value);
      if (results[2].status === 'fulfilled') setConvictionRates(results[2].value);
      if (results[3].status === 'fulfilled') setMapData(results[3].value);
      
      // Calculate totals from the leaderboard data
      if (results[4].status === 'fulfilled') {
        const nbwData = results[4].value;
        setNbwTotal(nbwData.reduce((acc, d) => acc + d.value, 0));
      }
      if (results[5].status === 'fulfilled') {
        const firearmsData = results[5].value;
        setFirearmsTotal(firearmsData.reduce((acc, d) => acc + d.value, 0));
      }
      
      // (This is a simplified fetch, you can expand it)
      
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []); // Runs once on mount
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  
  // --- FIX 5: Update KPI card values ---
  const kpiConviction = convictionRates[0] ? convictionRates[0].rate.toFixed(1) + '%' : '0%';
  const kpiAlerts = alerts.length;
  // Use the new state variables
  const kpiNbwExecuted = nbwTotal;
  const kpiFirearmsSeized = firearmsTotal;

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
        
        {/* --- FIX 6: Connect the StatsCards to the new state variables --- */}
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
        
        {/* AI Smart Alerts (Full Width) */}
        <AiForecastWidget alerts={alerts} />
        
        {/* Row 2: Geo-Map and AI Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <GeoAnalyticsWidget 
            mapData={mapData} 
          />
          <AiSummaryWidget summary={summary} />
        </div>

        {/* Row 3: Special Drive Leaderboards */}
        <div className="mt-6">
          <DriveLeaderboardWidget />
        </div>
        
        {/* --- [NEW] Row 4: District Performance & Top Officers --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <DistrictSpotlightWidget 
            prideData={convictionRates.map(c => ({ district: c.district, score: c.rate }))} // Use conviction rates for pride
            workloadData={[]} // You need to fetch and pass workloadData here
          />
          <TopOfficersWidget data={[]} /> {/* You need to fetch and pass topOfficers here */}
        </div>

      </div>
    </div>
  );
}

export default DGPDashboard;