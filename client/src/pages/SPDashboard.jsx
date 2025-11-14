import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Award, Brain, Target, Map, FileText, TrendingUp, TrendingDown, 
  Users, Clock, BarChart3, MapPin, Download, RefreshCw, CheckCircle, 
  Send, Inbox, Database
} from 'lucide-react';
import * as api from '../services/API';
// Fix for Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
// Modern Card Component with animations
const DashboardCard = ({ title, icon, children, gridSpan = "col-span-1", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setIsVisible(true), delay);
  }, [delay]);
  
  return (
    <div className={`glass-card glass-card-hover rounded-2xl p-6 ${gridSpan} ${isVisible ? 'slide-up' : 'opacity-0'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 gradient-blue rounded-xl shadow-lg">
            {React.cloneElement(icon, { className: "w-5 h-5 text-white" })}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full pulse"></span>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>
      <div className="h-[400px]">
        {children}
      </div>
    </div>
  );
};
// Enhanced Loading Component
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
    <div className="text-center">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Database className="w-10 h-10 text-blue-600 float-animation" />
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold text-gray-700">Loading Analytics...</p>
      <p className="mt-2 text-sm text-gray-500">Preparing your dashboard</p>
    </div>
  </div>
);
// Stats Card Component
const StatsCard = ({ title, value, change, icon, color, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
      // Animate number
      const target = typeof value === 'string' ? parseInt(value) : value;
      const duration = 1000;
      const steps = 30;
      const stepValue = target / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= target) {
          setDisplayValue(target);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }, delay);
  }, [value, delay]);
  
  return (
    <div className={`glass-card rounded-xl p-6 ${isVisible ? 'slide-up' : 'opacity-0'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2 ticker">
            {typeof value === 'string' && value.includes('%') 
              ? `${displayValue}%` 
              : typeof value === 'string' && value.includes('m')
              ? `${displayValue}m`
              : displayValue.toLocaleString()}
          </p>
          {change && (
            <div className="flex items-center mt-2">
              {change > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+{change}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm font-medium text-red-600">{change}%</span>
                </>
              )}
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color}`}>
          {React.cloneElement(icon, { className: "w-6 h-6 text-white" })}
        </div>
      </div>
    </div>
  );
};
// Enhanced Recognition Portal Widget
const RecognitionPortalWidget = ({ events }) => {
  const [approved, setApproved] = useState(new Set());
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const handleApprove = async (eventId) => {
    try {
      await api.approvePrideEvent(eventId);
      setApproved(prev => new Set(prev).add(eventId));
    } catch (err) {
      console.error("Failed to approve event:", err);
    }
  };
  
  const getIcon = (type) => {
    switch(type) {
      case 'excellence': return '⭐';
      case 'achievement': return '🏆';
      case 'innovation': return '💡';
      case 'community': return '🤝';
      default: return '👍';
    }
  };
  
  const getEventType = (event) => {
    if (event.source?.includes('AI')) return 'innovation';
    if (event.source?.includes('Life')) return 'excellence';
    if (event.source?.includes('Performance')) return 'achievement';
    return 'community';
  };
  
  const filteredEvents = selectedFilter === 'all' 
    ? events 
    : events.filter(e => getEventType(e) === selectedFilter);
  
  return (
    <DashboardCard 
      title="Recognition Portal" 
      icon={<Award />}
      delay={100}
    >
      <div className="h-full flex flex-col">
        <div className="flex gap-2 mb-4">
          {['all', 'excellence', 'achievement', 'innovation', 'community'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedFilter === filter 
                  ? 'gradient-blue text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No recognitions in this category</p>
            </div>
          )}
          {filteredEvents.map((event, index) => {
            const isApproved = approved.has(event.id);
            const eventType = getEventType(event);
            return (
              <div 
                key={event.id} 
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center hover:shadow-md transition-all"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="mr-3">
                  <span className="text-3xl" title={eventType}>
                    {getIcon(eventType)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{event.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {event.source}
                    </span>
                    <span className="text-xs text-gray-500">{event.date}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleApprove(event.id)}
                  disabled={isApproved}
                  className={`ml-4 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all transform hover:scale-105 flex items-center gap-2 ${
                    isApproved 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'gradient-success hover:shadow-lg'
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardCard>
  );
};
// Enhanced AI Case Blocker Widget with modern donut chart
const AICaseBlockerWidget = ({ data }) => {
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];
  const validData = data.filter(d => d.value > 0);
  const total = validData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <DashboardCard 
      title="AI Case Blocker Analysis" 
      icon={<Brain />}
      delay={200}
    >
      <div className="h-full flex">
        <div className="w-2/3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={validData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                startAngle={90}
                endAngle={-270}
              >
                {validData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
          <div className="text-center -mt-48">
            <p className="text-3xl font-bold text-gray-800">{total}</p>
            <p className="text-sm text-gray-500">Total Blockers</p>
          </div>
        </div>
        <div className="w-1/3 space-y-2 pl-4">
          {validData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{backgroundColor: COLORS[index % COLORS.length]}}
                ></div>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};
// Enhanced Tactical KPI Widget
const TacticalKpiWidget = ({ kpis }) => {
  if (!kpis) return null;
  
  // Generate trend data if not available
  const trendData = kpis.trend || [
    { month: "Jan", cases: 120, resolved: 105 },
    { month: "Feb", cases: 135, resolved: 118 },
    { month: "Mar", cases: 110, resolved: 98 },
    { month: "Apr", cases: 125, resolved: 109 },
    { month: "May", cases: 140, resolved: 122 },
    { month: "Jun", cases: 115, resolved: 100 }
  ];
  
  return (
    <DashboardCard 
      title="District Performance Metrics" 
      icon={<Target />}
      delay={300}
    >
      <div className="h-full flex flex-col">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Clearance Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{kpis.clearanceRate}%</p>
              </div>
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28 * kpis.clearanceRate / 100} ${2 * Math.PI * 28}`}
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">Crime Trend Analysis</p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
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
                dataKey="cases" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorCases)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="resolved" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorResolved)" 
                strokeWidth={2}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
};
// Enhanced Impact Map Widget
const ImpactMapWidget = ({ events, district }) => {
  const mapCenter = events.length > 0 
    ? [events[0].location.lat, events[0].location.lng]
    : [20.95, 84.5];
  
  const createCustomIcon = (event) => {
    return L.divIcon({
      html: `
        <div class="relative">
          <div class="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
          <div class="relative bg-white p-2 rounded-full shadow-lg border-2 border-blue-500">
            ${event.type === 'btc_nomination' ? '⭐' : '📍'}
          </div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });
  };
  
  return (
    <DashboardCard 
      title="Positive Impact Heatmap" 
      icon={<Map />}
      delay={400}
    >
      <div className="h-full flex flex-col">
        <div className="flex gap-2 mb-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
            <span className="text-lg">⭐</span>
            <span className="text-xs font-medium text-blue-800">Excellence</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full">
            <span className="text-lg">📍</span>
            <span className="text-xs font-medium text-purple-800">Achievement</span>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
          <MapContainer
            center={mapCenter}
            zoom={10}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {events.map(event => (
              <Marker
                key={event.id}
                position={[event.location.lat, event.location.lng]}
                icon={createCustomIcon(event)}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold text-sm">{event.type}</h4>
                    <p className="text-xs mt-1">{event.summary}</p>
                    <span className="text-xs text-gray-500">{event.date}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </DashboardCard>
  );
};
// Main Dashboard Component
function SPDashboard({ district = "Central District" }) {
  const [prideEvents, setPrideEvents] = useState([]);
  const [caseBlockers, setCaseBlockers] = useState([]);
  const [mapEvents, setMapEvents] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [hrData, setHrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.getPrideEvents(district),
        api.getCaseBlockers(district),
        api.getPrideMapEvents(district),
        api.getCctnsKpis(district),
        api.getHrData()
      ]);
      
      if (results[0].status === 'fulfilled') setPrideEvents(results[0].value);
      if (results[1].status === 'fulfilled') setCaseBlockers(results[1].value);
      if (results[2].status === 'fulfilled') setMapEvents(results[2].value);
      if (results[3].status === 'fulfilled') setKpis(results[3].value);
      if (results[4].status === 'fulfilled') setHrData(results[4].value);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [district]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  
  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen gradient-mesh">
      <style jsx>{`
        .gradient-mesh {
          background-color: #f0f9ff;
          background-image: 
            radial-gradient(at 47% 33%, hsl(214.7, 100%, 97%) 0, transparent 59%), 
            radial-gradient(at 82% 65%, hsl(217.2, 100%, 95%) 0, transparent 55%);
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
        }
        
        .glass-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px 0 rgba(31, 38, 135, 0.15);
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
        
        .gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        .ticker {
          animation: ticker 0.5s ease-out;
        }
        
        @keyframes ticker {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      
      {/* Header */}
      <header className="glass-card border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 gradient-blue rounded-xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  District Intelligence Platform
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {district}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button 
                onClick={handleRefresh}
                className={`px-4 py-2 gradient-blue text-white rounded-xl shadow-lg text-sm font-medium hover:shadow-xl transition-all flex items-center gap-2 ${refreshing ? 'opacity-75' : ''}`}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            title="Total Cases (District)" 
            value={kpis?.totalCases || 0} 
            change={12.5} // Note: 'change' is still mock, as we don't have historical data for it
            icon={<FileText />}
            color="gradient-blue"
            delay={0}
          />
          <StatsCard 
            title="Clearance Rate" 
            value={`${kpis?.clearanceRate || 0}%`} 
            change={5.2}
            icon={<TrendingUp />}
            color="gradient-success"
            delay={100}
          />
          <StatsCard 
            title="Active Officers (District)" 
            value={(hrData && hrData[district]) ? hrData[district].total_strength : 0} 
            change={-2.1}
            icon={<Users />}
            color="gradient-warning"
            delay={200}
          />
          <StatsCard 
            title="Avg. Response Time" 
            value="4.2m" // This remains hardcoded, as we don't have this data
            change={-8.3}
            icon={<Clock />}
            color="gradient-primary"
            delay={300}
          />
        </div>
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecognitionPortalWidget events={prideEvents} />
          <AICaseBlockerWidget data={caseBlockers} />
          <TacticalKpiWidget kpis={kpis} />
          <ImpactMapWidget events={mapEvents} district={district} />
        </div>
      </div>
    </div>
  );
}
export default SPDashboard;