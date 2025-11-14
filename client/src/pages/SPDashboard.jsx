import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, FunnelChart, Funnel, LabelList,
  PolarGrid       // <-- ADD THIS
} from 'recharts';

import {
  Shield, BarChart3, RefreshCw, Download, Calendar, Filter, Eye,
  Database, MapPin, Edit, Send, CheckCircle, Clock, Users, Search,
  FileText, Home, Truck, Waves, UserCheck // Added new icons
} from 'lucide-react';

// Import all our NEW CCTNS API functions
import * as api from '../services/API';
import { useAuth } from '../context/AuthContext'; // To get user info

// --- REUSABLE UI COMPONENTS (Your beautiful style) ---

const DashboardCard = ({ title, icon, children, gridSpan = "col-span-1", delay = 0, height = "h-[400px]" }) => {
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
            <p className="text-sm text-gray-500 mt-1">District-level insights</p>
          </div>
        </div>
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
        <p className="text-2xl font-bold text-gray-800">District Command Center</p>
        <p className="text-sm text-gray-600">Loading your district's CCTNS data...</p>
      </div>
    </div>
  </div>
);

// --- FORM STYLING ---
// Reusable components for the CCTNS data entry forms
const FormSection = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2 mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

const FormInput = ({ label, value, onChange, name, type = "number" }) => (
  <div className="flex flex-col">
    <label className="text-xs font-medium text-gray-500 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);


// --- SP DASHBOARD WIDGETS ---

// --- WIDGET 1: Pendency Gauge ---
const PendencyGaugeWidget = ({ data }) => {
  const percentage = data.pendency_percentage || 0;
  const color = percentage > 40 ? '#ef4444' : percentage > 30 ? '#f59e0b' : '#10b981';
  
  return (
    <DashboardCard title="Case Pendency (Cog. Cases > 30 Days)" icon={<Clock />} height="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={30}
          data={[{ value: percentage }]}
          startAngle={90}
          endAngle={-270}
        >
          <PolarGrid gridType="polygon" />
          <RadialBar
            minAngle={15}
            background
            clockWise
            dataKey="value"
            fill={color}
            cornerRadius={15}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-5xl font-bold fill-gray-800"
          >
            {`${percentage.toFixed(1)}%`}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
};

// --- WIDGET 2: NBW Drive Funnel ---
const NbwFunnelWidget = ({ data }) => {
  const funnelData = [
    { name: 'Total NBWs', value: data.total_nbw || 0, fill: '#3b82f6' },
    { name: 'Total Disposed', value: data.total_disposed_off || 0, fill: '#10b981' },
    { name: 'Executed', value: data.executed_total || 0, fill: '#8b5cf6' },
  ];
  
  return (
    <DashboardCard title="NBW Drive Funnel" icon={<UserCheck />} height="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip />
          <Funnel dataKey="value" data={funnelData} isAnimationActive>
            <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
};

// --- WIDGET 3: Missing Persons Tracker ---
const MissingPersonsWidget = ({ data }) => {
  const chartData = [
    { name: 'Boys', Missing: data.boy_missing_start, Traced: data.boy_traced },
    { name: 'Girls', Missing: data.girl_missing_start, Traced: data.girl_traced },
    { name: 'Male', Missing: data.male_missing_start, Traced: data.male_traced },
    { name: 'Female', Missing: data.female_missing_start, Traced: data.female_traced },
  ];
  
  return (
    <DashboardCard title="Missing Persons Drive" icon={<Search />} height="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" />
          <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar dataKey="Missing" fill="#ef4444" radius={[0, 8, 8, 0]} />
          <Bar dataKey="Traced" fill="#10b981" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
};


// --- Main SP Dashboard Component ---
function SPDashboard() {
  const { user } = useAuth(); // Get logged-in user (e.g., { role: 'SP', district: 'Khordha' })
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(9); // Default to latest month (September)
  
  // This one state will hold all 7 data objects
  const [formData, setFormData] = useState({});
  const [kpiData, setKpiData] = useState({}); // For the charts
  
  // --- Data Fetching ---
  const fetchData = async () => {
    if (!user || !user.district) return;
    
    try {
      const data = await api.getDistrictData(user.district, month);
      setFormData(data); // Set the data for the forms
      setKpiData(data); // Set the data for the charts
    } catch (err) {
      console.error("Error fetching SP data:", err);
      alert(`Failed to fetch data: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [user, month]); // Refetch if user or month changes

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- Form Handling ---
  const handleFormChange = (formName, e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [formName]: {
        ...prev[formName],
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Add user/month info to the report
      const reportData = {
        ...formData,
        district: user.district,
        month: month,
        year: 2025
      };
      await api.postCctnsReport(reportData);
      alert("Report submitted successfully!");
    } catch (err) {
      console.error("Error submitting report:", err);
      alert(`Failed to submit: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };
  
  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }
  
  // Destructure for easier access
  const { convictions, nbw, firearms, sand_mining, missing_persons, pendency, preventive } = formData;

  return (
    <div className="min-h-screen gradient-mesh">
      <style jsx>{`
        /* --- Your exact styling from DGP dashboard --- */
        .gradient-mesh { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); background-size: cover; background-attachment: fixed; }
        .gradient-mesh::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(224, 242, 254, 0.95) 25%, rgba(224, 231, 255, 0.95) 50%, rgba(219, 234, 254, 0.95) 100%); z-index: -1; }
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15); }
        .glass-card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .glass-card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px 0 rgba(31, 38, 135, 0.25); }
        .gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .gradient-blue { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); }
        .gradient-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .float-animation { animation: float 4s ease-in-out infinite; }
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
                  District Command Center
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  SP Dashboard: <span className="font-semibold text-gray-700">{user.district}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                <option value={9}>September 2025</option>
                <option value={8}>August 2025</option>
              </select>
              <button 
                onClick={handleRefresh}
                className={`px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 ${refreshing ? 'opacity-75' : ''}`}
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
        
        {/* Row 1: Internal KPI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <PendencyGaugeWidget data={kpiData.pendency || {}} />
          <NbwFunnelWidget data={kpiData.nbw || {}} />
          <MissingPersonsWidget data={kpiData.missing_persons || {}} />
        </div>

        {/* Row 2: CCTNS Data Entry & Report Generation */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 gradient-blue rounded-xl shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">CCTNS "Good Work Done" Report</h2>
                <p className="text-sm text-gray-500 mt-1">Submit your district's monthly data here.</p>
              </div>
            </div>
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 gradient-success text-white rounded-xl shadow-lg text-sm font-medium hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Report to DGP
            </button>
          </div>
          
          {/* This is a simple tab-like structure. We can add a real tab component later. */}
          <div className="h-[600px] overflow-y-auto custom-scrollbar pr-2">
            
            {/* --- PART 1a: NBW --- */}
            <FormSection title="Part 1a: NBW Drive">
              <FormInput label="Pending (Start)" name="pending_start_of_month" value={nbw?.pending_start_of_month} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Received This Month" name="received_this_month" value={nbw?.received_this_month} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Executed (Total)" name="executed_total" value={nbw?.executed_total} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Disposed (Total)" name="disposed_total" value={nbw?.disposed_total} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Pending (End)" name="pending_end_of_month" value={nbw?.pending_end_of_month} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Executed (Old Cases)" name="executed_old_cases" value={nbw?.executed_old_cases} onChange={e => handleFormChange('nbw', e)} />
            </FormSection>

            {/* --- PART 1b: Firearms --- */}
            <FormSection title="Part 1b: Firearms Drive">
              <FormInput label="Cases Registered" name="cases_registered" value={firearms?.cases_registered} onChange={e => handleFormChange('firearms', e)} />
              <FormInput label="Persons Arrested" name="persons_arrested" value={firearms?.persons_arrested} onChange={e => handleFormChange('firearms', e)} />
              <FormInput label="Pistols Seized" name="seizure_pistol" value={firearms?.seizure_pistol} onChange={e => handleFormChange('firearms', e)} />
              <FormInput label="Ammunition Seized" name="seizure_ammunition" value={firearms?.seizure_ammunition} onChange={e => handleFormChange('firearms', e)} />
              <FormInput label="AK-47 Seized" name="seizure_ak_47" value={firearms?.seizure_ak_47} onChange={e => handleFormChange('firearms', e)} />
            </FormSection>

            {/* --- PART 1c: Sand Mining --- */}
            <FormSection title="Part 1c: Sand Mining Drive">
              <FormInput label="Cases Registered" name="cases_registered" value={sand_mining?.cases_registered} onChange={e => handleFormChange('sand_mining', e)} />
              <FormInput label="Vehicles Seized" name="vehicle_seized" value={sand_mining?.vehicle_seized} onChange={e => handleFormChange('sand_mining', e)} />
              <FormInput label="Persons Arrested" name="persons_arrested" value={sand_mining?.persons_arrested} onChange={e => handleFormChange('sand_mining', e)} />
            </FormSection>
            
            {/* --- PART 1g: Narcotics --- */}
            <FormSection title="Part 1g: Narcotics Drive">
              <FormInput label="Cases Registered" name="narcotics_cases_registered" value={preventive?.narcotics_cases_registered} onChange={e => handleFormChange('preventive', e)} />
              <FormInput label="Persons Arrested" name="narcotics_persons_arrested" value={preventive?.narcotics_persons_arrested} onChange={e => handleFormChange('preventive', e)} />
              <FormInput label="Ganja Seized (Kg)" name="narcotics_seizure_ganja_kg" value={preventive?.narcotics_seizure_ganja_kg} onChange={e => handleFormChange('preventive', e)} />
              <FormInput label="Brownsugar (gm)" name="narcotics_seizure_brownsugar_gm" value={preventive?.narcotics_seizure_brownsugar_gm} onChange={e => handleFormChange('preventive', e)} />
              <FormInput label="Vehicles Seized" name="narcotics_seizure_vehicles" value={preventive?.narcotics_seizure_vehicles} onChange={e => handleFormChange('preventive', e)} />
            </FormSection>

            {/* --- PART 2: Convictions --- */}
            <FormSection title="Part 2: Convictions">
              <FormInput label="IPC Trial Completed" name="ipc_bns_trial_completed" value={convictions?.ipc_bns_trial_completed} onChange={e => handleFormChange('convictions', e)} />
              <FormInput label="IPC Conviction" name="ipc_bns_conviction" value={convictions?.ipc_bns_conviction} onChange={e => handleFormChange('convictions', e)} />
              <FormInput label="IPC Acquitted" name="ipc_bns_acquitted" value={convictions?.ipc_bns_acquitted} onChange={e => handleFormChange('convictions', e)} />
              <FormInput label="SLL Trial Completed" name="sll_trial_completed" value={convictions?.sll_trial_completed} onChange={e => handleFormChange('convictions', e)} />
              <FormInput label="SLL Conviction" name="sll_conviction" value={convictions?.sll_conviction} onChange={e => handleFormChange('convictions', e)} />
              <FormInput label="Speedy Trial Convictions" name="speedy_trial_convictions" value={convictions?.speedy_trial_convictions} onChange={e => handleFormChange('convictions', e)} />
            </FormSection>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default SPDashboard;