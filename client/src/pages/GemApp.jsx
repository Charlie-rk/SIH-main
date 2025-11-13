import React, { useState, useEffect } from 'react';

// Import our (not-yet-created) components.
// This will show an error until we create these files.

import ImpactMap from '../components/ImpactMap';
import Leaderboard from '../components/Leaderboard';
import StatsChart from '../components/StatsChart';
import AIAnalyzer from '../components/AIAnalyzer';
import HeaderG from '../components/HeaderG';

// We will use this later. For now, data is mocked in this file.
// import { getEvents } from './services/api'; 

/**
 * MOCK DATA
 * In a real app, this comes from our backend API.
 * For the hackathon, we can load this from a mock_data.json
 * or just define it here to get the frontend working.
 */
const mockEvents = [
  {
    id: 1,
    type: 'community_engagement',
    officer: 'J. Smith (ID 405)',
    date: '2025-11-10',
    location: { lat: 20.2961, lng: 85.8245 }, // Bhubaneswar
    summary: 'Met with park dept. re: lighting at XYZ Park.'
  },
  {
    id: 2,
    type: 'citizen_commendation',
    officer: 'A. Kaur (ID 301)',
    date: '2025-11-09',
    location: { lat: 20.2761, lng: 85.8045 },
    source: 'AI_Sentiment_Analyzer',
    summary: 'Email from citizen praising officer\'s help with lost child.'
  },
  {
    id: 3,
    type: 'btc_nomination',
    officer: 'R. Chen (ID 552)',
    date: '2025-11-11',
    location: { lat: 20.2861, lng: 85.8145 },
    source: 'AI_Transcript_Analyzer',
    summary: 'AI Flag: High Professionalism (De-escalation) detected.'
  }
];

// Mock data for our chart
const mockChartData = {
  labels: ['Community Assist', 'De-escalation', 'Citizen Commendation', 'Life-Saving'],
  datasets: [
    {
      label: '# of Positive Actions this Month',
      data: [12, 19, 7, 3],
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(255, 99, 132, 0.6)',
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(255, 99, 132, 1)',
      ],
      borderWidth: 1,
    },
  ],
};


function GemApp() {
  // State to hold all our dashboard data
  const [events, setEvents] = useState([]);
  const [chartData, setChartData] = useState(null);

  // useEffect hook runs once when the component mounts
  useEffect(() => {
    // In a real app, you'd fetch data here:
    // getEvents().then(data => setEvents(data));

    // For the hackathon, we just set our mock data
    setEvents(mockEvents);
    setChartData(mockChartData);
  }, []); // The empty array [] means this runs only once.

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      
      {/* 1. HEADER */}
      <HeaderG />

      {/* 2. MAIN DASHBOARD GRID */}
      {/* We use Tailwind's grid. On medium screens and up, it's 3 columns. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

        {/* 2a. MAIN CONTENT (MAP) - Spans 2 columns */}
        <div className="md:col-span-2 h-[500px] bg-gray-800 rounded-lg p-4 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-cyan-300">Positive Impact Map</h2>
          <ImpactMap events={events} />
        </div>

        {/* 2b. SIDEBAR (LEADERBOARD) - Spans 1 column */}
        <div className="md:col-span-1 h-[500px] bg-gray-800 rounded-lg p-4 shadow-lg overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-4 text-green-300">"Beyond the Call" Feed</h2>
          <Leaderboard events={events} />
        </div>

        {/* 2c. AI ANALYZER - Spans all 3 columns */}
        <div className="md:col-span-3 bg-gray-800 rounded-lg p-4 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">AI Analysis Tools</h2>
          <AIAnalyzer />
        </div>

        {/* 2d. STATS CHART - Spans 1 column (we can add more) */}
        <div className="md:col-span-3 bg-gray-800 rounded-lg p-4 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">Monthly Recognition Stats</h2>
          {/* We pass a 'loading' check in case data isn't ready */}
          {chartData ? 
            <StatsChart chartData={chartData} /> : 
            <p>Loading chart data...</p>
          }
        </div>

      </div>
    </div>
  );
}

export default GemApp;