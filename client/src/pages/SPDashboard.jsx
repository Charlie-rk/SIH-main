import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, FunnelChart, Funnel, LabelList,
  PolarGrid
} from 'recharts';

import {
  Shield, BarChart3, RefreshCw, Download, Calendar, Filter, Eye,
  Database, MapPin, Edit, Send, CheckCircle, Clock, Users, Search,
  FileText, Home, Truck, Waves, UserCheck // All icons are here
} from 'lucide-react';

// Import libraries for export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Import your actual API functions
import * as api from '../services/API';
import { useAuth } from '../context/AuthContext';

// --- REUSABLE UI COMPONENTS ---
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

// --- NEW: Smart Upload Widget (integrated from File 1) ---
const SmartUploadWidget = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [reportType, setReportType] = useState('nbw'); // Default to NBW
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first.' });
      return;
    }
    
    setIsUploading(true);
    setMessage(null);
    
    try {
      // Reuses the API from ../services/API
      const res = await api.uploadCctnsFile(file, reportType);
      
      // Call the callback function from the parent (SPDashboard)
      onUploadSuccess(reportType, res.data);
      
      setMessage({ type: 'success', text: res.message || 'File parsed successfully.' });
      setFile(null); // Clear the file input
      
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage({ type: 'error', text: err.response?.data?.error || "Upload failed." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardCard title="Smart Report Upload (AI)" icon={<FileText />} height="h-[300px]">
      <div className="h-full flex flex-col justify-between">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">1. Select Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="nbw">Part 1a: NBW Drive</option>
            <option value="firearms" disabled>Part 1b: Firearms (Coming Soon)</option>
            <option value="sand_mining" disabled>Part 1c: Sand Mining (Coming Soon)</option>
          </select>

          <label className="text-xs font-medium text-gray-500 mt-4 mb-1 block">2. Upload File (PDF/Excel)</label>
          <div className="relative p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-400" />
            <span className="mt-2 block text-sm text-gray-600">
              {file ? file.name : "Drag & Drop or Click to Browse"}
            </span>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".pdf,.xlsx,.xls"
            />
          </div>
        </div>

        {message && (
          <div className={`p-2 rounded-md text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full p-3 gradient-blue text-white font-bold rounded-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <RefreshCw className="animate-spin" />
              Parsing...
            </>
          ) : (
            "Upload & Auto-Fill Form"
          )}
        </button>
      </div>
    </DashboardCard>
  );
};


// --- Helper constant for report generation ---
const reportFieldMapping = {
  nbw: {
    title: "Part 1a: NBW Drive",
    fields: {
      pending_start_of_month: "Pending (Start)",
      received_this_month: "Received This Month",
      executed_total: "Executed (Total)",
      disposed_total: "Disposed (Total)",
      pending_end_of_month: "Pending (End)",
      executed_old_cases: "Executed (Old Cases)"
    }
  },
  firearms: {
    title: "Part 1b: Firearms Drive",
    fields: {
      cases_registered: "Cases Registered",
      persons_arrested: "Persons Arrested",
      seizure_pistol: "Pistols Seized",
      seizure_ammunition: "Ammunition Seized",
      seizure_ak_47: "AK-47 Seized"
    }
  },
  sand_mining: {
    title: "Part 1c: Sand Mining Drive",
    fields: {
      cases_registered: "Cases Registered",
      vehicle_seized: "Vehicles Seized",
      persons_arrested: "Persons Arrested"
    }
  },
  preventive: {
    title: "Part 1g: Narcotics Drive",
    fields: {
      narcotics_cases_registered: "Cases Registered",
      narcotics_persons_arrested: "Persons Arrested",
      narcotics_seizure_ganja_kg: "Ganja Seized (Kg)",
      narcotics_seizure_brownsugar_gm: "Brownsugar (gm)",
      narcotics_seizure_vehicles: "Vehicles Seized"
    }
  },
  convictions: {
    title: "Part 2: Convictions",
    fields: {
      ipc_bns_trial_completed: "IPC Trial Completed",
      ipc_bns_conviction: "IPC Conviction",
      ipc_bns_acquitted: "IPC Acquitted",
      sll_trial_completed: "SLL Trial Completed",
      sll_conviction: "SLL Conviction",
      speedy_trial_convictions: "Speedy Trial Convictions"
    }
  }
};

// --- Main SP Dashboard Component ---
function SPDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(9);
  
  const [formData, setFormData] = useState({});
  const [kpiData, setKpiData] = useState({});

  const [showSubmitMenu, setShowSubmitMenu] = useState(false);
  const submitMenuRef = useRef(null);
  
  // --- Data Fetching ---
  const fetchData = async () => {
    if (!user || !user.district) return;
    
    try {
      const data = await api.getDistrictData(user.district, month);
      setFormData(data);
      setKpiData(data);
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
  }, [user, month]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (submitMenuRef.current && !submitMenuRef.current.contains(event.target)) {
        setShowSubmitMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [submitMenuRef]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- Form Handling ---
  const handleFormChange = (formName, e) => {
    const { name, value, type } = e.target;
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

  // --- NEW: handler for upload success from SmartUploadWidget (from File 1) ---
  const handleUploadSuccess = (reportType, parsedData) => {
    // `reportType` is 'nbw', `parsedData` is the JSON object from the AI
    setFormData(prev => ({
      ...prev,
      [reportType]: parsedData
    }));
    
    // Also update the kpiData to refresh the charts
    setKpiData(prev => ({
      ...prev,
      [reportType]: parsedData
    }));
    
    alert("Success! The form has been pre-filled with the data from your file.");
  };

  const handleSubmitFromMenu = () => {
    handleSubmit();
    setShowSubmitMenu(false);
  };

  // --- Helper function to get report metadata ---
  const getReportMetadata = () => {
    const monthName = new Date(2025, month - 1, 1).toLocaleString('default', { month: 'long' });
    const district = user.district || "Unknown";
    const title = `CCTNS "Good Work Done" Report - ${district}`;
    const subtitle = `Month: ${monthName} 2025`;
    const filename = `CCTNS_Report_${district}_${monthName}`;
    return { title, subtitle, filename, monthName, district };
  };

  // --- ENHANCED PDF Export ---
  const handleExportPDF = () => {
    try {
      const { title, subtitle, filename, district } = getReportMetadata();
      const doc = new jsPDF();
      let startY = 25;

      // Add Header with background
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, 210, 35, 'F');
      
      // Add Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(title, 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(subtitle, 105, 23, { align: 'center' });
      doc.text(`District: ${district}`, 105, 29, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      startY = 45;

      // Iterate over the form sections
      for (const formKey in reportFieldMapping) {
        if (!reportFieldMapping.hasOwnProperty(formKey)) continue;

        const section = reportFieldMapping[formKey];
        const data = formData[formKey] || {};
        
        // Check if we need a new page
        if (startY > 250) {
          doc.addPage();
          startY = 20;
        }
        
        // Add section title with background
        doc.setFillColor(240, 240, 250);
        doc.rect(14, startY - 7, 182, 10, 'F');
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(76, 75, 105);
        doc.text(section.title, 16, startY);
        doc.setTextColor(0, 0, 0);
        
        startY += 8;
        
        const tableHead = [['Metric', 'Value']];
        const tableBody = [];

        // Populate table body from mapping
        for (const fieldKey in section.fields) {
          if (section.fields.hasOwnProperty(fieldKey)) {
            tableBody.push([
              section.fields[fieldKey],
              String(data[fieldKey] || 0)
            ]);
          }
        }

        // Call autoTable
        autoTable(doc, {
          startY: startY,
          head: tableHead,
          body: tableBody,
          theme: 'striped',
          headStyles: { 
            fillColor: [76, 75, 105],
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 10
          },
          columnStyles: {
            0: { cellWidth: 130, halign: 'left' },
            1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 },
          alternateRowStyles: { fillColor: [245, 247, 250] }
        });
        
        startY = doc.lastAutoTable.finalY + 12;
      }

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
          105,
          285,
          { align: 'center' }
        );
      }

      doc.save(`${filename}.pdf`);
      setShowSubmitMenu(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please check the console for details.");
      setShowSubmitMenu(false);
    }
  };

  // --- ENHANCED CSV Export ---
  const handleExportCSV = () => {
    try {
      const { title, subtitle, filename, district, monthName } = getReportMetadata();
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel compatibility
      
      // Header section
      csvContent += `"${title}"\r\n`;
      csvContent += `"${subtitle}"\r\n`;
      csvContent += `"District: ${district}"\r\n`;
      csvContent += `"Generated: ${new Date().toLocaleString()}"\r\n`;
      csvContent += `\r\n`;

      // Iterate over the form sections
      for (const formKey in reportFieldMapping) {
        if (!reportFieldMapping.hasOwnProperty(formKey)) continue;

        const section = reportFieldMapping[formKey];
        const data = formData[formKey] || {};
        
        csvContent += `"${section.title}"\r\n`;
        csvContent += `"Metric","Value"\r\n`;

        // Populate CSV rows
        for (const fieldKey in section.fields) {
          if (section.fields.hasOwnProperty(fieldKey)) {
            const label = section.fields[fieldKey];
            const value = data[fieldKey] || 0;
            csvContent += `"${label}","${value}"\r\n`;
          }
        }
        csvContent += `\r\n\r\n`; // Double space between sections
      }
      
      // Add footer
      csvContent += `"Report generated by District Command Center"\r\n`;
      
      // Create and trigger download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowSubmitMenu(false);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("An error occurred while generating the CSV. Please check the console for details.");
      setShowSubmitMenu(false);
    }
  };

  // --- ENHANCED Excel Export ---
  const handleExportExcel = () => {
    try {
      const { title, subtitle, filename, district, monthName } = getReportMetadata();
      
      const wb = XLSX.utils.book_new();
      let ws_data = [];
      
      // Header section with spacing
      ws_data.push([title]);
      ws_data.push([subtitle]);
      ws_data.push([`District: ${district}`]);
      ws_data.push([`Generated: ${new Date().toLocaleString()}`]);
      ws_data.push([]); // Spacer
      ws_data.push([]); // Double spacer

      let currentRow = 6; // Track row index

      // Iterate over the form sections
      for (const formKey in reportFieldMapping) {
        if (!reportFieldMapping.hasOwnProperty(formKey)) continue;

        const section = reportFieldMapping[formKey];
        const data = formData[formKey] || {};
        
        // Add section title (merged cell)
        ws_data.push([section.title]);
        currentRow++;
        
        // Add table headers
        ws_data.push(["Metric", "Value"]);
        const headerRow = currentRow;
        currentRow++;

        // Populate Excel rows
        for (const fieldKey in section.fields) {
          if (section.fields.hasOwnProperty(fieldKey)) {
            const label = section.fields[fieldKey];
            const value = data[fieldKey] || 0;
            ws_data.push([label, value]);
            currentRow++;
          }
        }
        ws_data.push([]); // Spacer between sections
        ws_data.push([]); // Double spacer
        currentRow += 2;
      }
      
      // Add footer
      ws_data.push([]);
      ws_data.push(["Report generated by District Command Center"]);
      
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      
      // Apply styling
      const range = XLSX.utils.decode_range(ws['!ref']);
      
      // Style title (row 0)
      if(ws["A1"]) ws["A1"].s = { 
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "667EEA" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
      
      // Style subtitle (row 1)
      if(ws["A2"]) ws["A2"].s = { 
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "center" }
      };
      
      // Style district info (row 2)
      if(ws["A3"]) ws["A3"].s = { 
        font: { sz: 11 },
        alignment: { horizontal: "center" }
      };
      
      // Style generated date (row 3)
      if(ws["A4"]) ws["A4"].s = { 
        font: { sz: 10, italic: true },
        fill: { fgColor: { rgb: "F0F0FA" } },
        alignment: { horizontal: "center" }
      };

      // Style section titles and headers
      let rowIdx = 7; // Start after header section
      for (const formKey in reportFieldMapping) {
        if (!reportFieldMapping.hasOwnProperty(formKey)) continue;
        
        const section = reportFieldMapping[formKey];
        const data = formData[formKey] || {};
        const fieldCount = Object.keys(section.fields).length;
        
        // Section title styling
        const sectionCell = `A${rowIdx}`;
        if(ws[sectionCell]) {
          ws[sectionCell].s = { 
            font: { bold: true, sz: 13, color: { rgb: "4C4B69" } },
            fill: { fgColor: { rgb: "E0E7FF" } },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              bottom: { style: "medium", color: { rgb: "667EEA" } }
            }
          };
        }
        rowIdx++;
        
        // Header row styling
        const headerCellA = `A${rowIdx}`;
        const headerCellB = `B${rowIdx}`;
        if(ws[headerCellA]) {
          ws[headerCellA].s = { 
            font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4C4B69" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        if(ws[headerCellB]) {
          ws[headerCellB].s = { 
            font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4C4B69" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        rowIdx++;
        
        // Data row styling with alternating colors
        for (let i = 0; i < fieldCount; i++) {
          const cellA = `A${rowIdx}`;
          const cellB = `B${rowIdx}`;
          const fillColor = i % 2 === 0 ? "FFFFFF" : "F5F7FA";
          
          if(ws[cellA]) {
            ws[cellA].s = { 
              fill: { fgColor: { rgb: fillColor } },
              alignment: { horizontal: "left", vertical: "center" },
              border: {
                bottom: { style: "thin", color: { rgb: "E5E7EB" } }
              }
            };
          }
          if(ws[cellB]) {
            ws[cellB].s = { 
              fill: { fgColor: { rgb: fillColor } },
              alignment: { horizontal: "right", vertical: "center" },
              font: { bold: true },
              border: {
                bottom: { style: "thin", color: { rgb: "E5E7EB" } }
              }
            };
          }
          rowIdx++;
        }
        rowIdx += 2; // Skip spacer rows
      }

      // Set column widths
      ws['!cols'] = [
        { wch: 45 }, // Metric column
        { wch: 15 }  // Value column
      ];
      
      // Set row heights
      ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 25 }; // Title row
      ws['!rows'][1] = { hpt: 20 }; // Subtitle row

      // Merge cells for title
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); // Merge A1:B1
      ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }); // Merge A2:B2
      ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }); // Merge A3:B3
      ws['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }); // Merge A4:B4

      XLSX.utils.book_append_sheet(wb, ws, "CCTNS Report");
      XLSX.writeFile(wb, `${filename}.xlsx`);

      setShowSubmitMenu(false);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("An error occurred while generating the Excel. Please check the console for details.");
      setShowSubmitMenu(false);
    }
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }
  
  const { convictions, nbw, firearms, sand_mining, missing_persons, pendency, preventive } = formData;

  return (
    <div className="min-h-screen gradient-mesh">
      <style jsx>{`
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

        {/* NEW: Smart Upload widget (from File 1) */}
        <div className="mb-6">
          <SmartUploadWidget onUploadSuccess={handleUploadSuccess} />
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

            {/* Dropdown Button */}
            <div className="relative" ref={submitMenuRef}>
              <button
                onClick={() => setShowSubmitMenu(!showSubmitMenu)}
                className="px-4 py-2 gradient-success text-white rounded-xl shadow-lg text-sm font-medium hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Submit / Export Report
              </button>
              
              {showSubmitMenu && (
                <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-2xl z-50 p-2">
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={handleSubmitFromMenu}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <Send className="w-4 h-4 text-blue-500" />
                        Submit to DGP
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleExportPDF}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        Download as PDF
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleExportCSV}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <Database className="w-4 h-4 text-blue-700" />
                        Download as CSV
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleExportExcel}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <FileText className="w-4 h-4 text-green-600" />
                        Download as Excel
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

          </div>
          
          {/* Form sections */}
          <div className="h-[600px] overflow-y-auto custom-scrollbar pr-2">
            
            {/* PART 1a: NBW */}
            <FormSection title="Part 1a: NBW Drive">
              <FormInput label="Pending (Start)" name="pending_start_of_month" value={nbw?.pending_start_of_month} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Received This Month" name="received_this_month" value={nbw?.received_this_month} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Executed (Total)" name="executed_total" value={nbw?.executed_total} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Disposed (Total)" name="disposed_total" value={nbw?.disposed_total} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Pending (End)" name="pending_end_of_month" value={nbw?.pending_end_of_month} onChange={e => handleFormChange('nbw', e)} />
              <FormInput label="Executed (Old Cases)" name="executed_old_cases" value={nbw?.executed_old_cases} onChange={e => handleFormChange('nbw', e)} />
            </FormSection>

            {/* PART 1b: Firearms */}
            <FormSection title="Part 1b: Firearms Drive">
              <FormInput label="Cases Registered" name="cases_registered" value={firearms?.cases_registered} onChange={e => handleFormChange('firearms', e)} />
              <FormInput label="Persons Arrested" name="persons_arrested" value={firearms?.persons_arrested} onChange={e => handleFormChange('firearms', e)} />
              <FormInput label="Pistols Seized" name="seizure_pistol" value={firearms?.seizure_pistol} onChange={e => handleFormChange('firearms', e)} />
              <FormInput label="Ammunition Seized" name="seizure_ammunition" value={firearms?.seizure_ammunition} onChange={e => handleFormChange('firearms', e)} />
              <FormInput label="AK-47 Seized" name="seizure_ak_47" value={firearms?.seizure_ak_47} onChange={e => handleFormChange('firearms', e)} />
            </FormSection>

            {/* PART 1c: Sand Mining */}
            <FormSection title="Part 1c: Sand Mining Drive">
              <FormInput label="Cases Registered" name="cases_registered" value={sand_mining?.cases_registered} onChange={e => handleFormChange('sand_mining', e)} />
              <FormInput label="Vehicles Seized" name="vehicle_seized" value={sand_mining?.vehicle_seized} onChange={e => handleFormChange('sand_mining', e)} />
              <FormInput label="Persons Arrested" name="persons_arrested" value={sand_mining?.persons_arrested} onChange={e => handleFormChange('sand_mining', e)} />
            </FormSection>
            
            {/* PART 1g: Narcotics */}
            <FormSection title="Part 1g: Narcotics Drive">
              <FormInput label="Cases Registered" name="narcotics_cases_registered" value={preventive?.narcotics_cases_registered} onChange={e => handleFormChange('preventive', e)} />
              <FormInput label="Persons Arrested" name="narcotics_persons_arrested" value={preventive?.narcotics_persons_arrested} onChange={e => handleFormChange('preventive', e)} />
              <FormInput label="Ganja Seized (Kg)" name="narcotics_seizure_ganja_kg" value={preventive?.narcotics_seizure_ganja_kg} onChange={e => handleFormChange('preventive', e)} />
              <FormInput label="Brownsugar (gm)" name="narcotics_seizure_brownsugar_gm" value={preventive?.narcotics_seizure_brownsugar_gm} onChange={e => handleFormChange('preventive', e)} />
              <FormInput label="Vehicles Seized" name="narcotics_seizure_vehicles" value={preventive?.narcotics_seizure_vehicles} onChange={e => handleFormChange('preventive',e)} />
            </FormSection>

            {/* PART 2: Convictions */}
            <FormSection title="Part 2: Convictions">
              <FormInput label="IPC Trial Completed" name="ipc_bns_trial_completed" value={convictions?.ipc_bns_trial_completed} onChange={e => handleFormChange('convictions', e)} />
              <FormInput label="IPC Conviction" name="ipc_bns_conviction" value={convictions?.ipc_bns_conviction} onChange={e => handleFormChange('convictions', e)} />
              <FormInput label="IPC Acquitted" name="ipc_bns_acquitted" value={convictions?.ipc_bns_acquitted} onChange={e => handleFormChange('convictions', e)} />
              <FormInput label="SLL Trial Completed" name="sll_trial_completed" value={convictions?.sll_trial_completed} onChange={e => handleFormChange('convD:\Projects\CCTNS-Dashboard\cctns-frontend\src\pages\SPDashboard.jsxconvictions', e)} />
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