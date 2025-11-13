import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

/**
 * Register the Chart.js components we want to use.
 * This is a required step for Chart.js v3+ with React.
 * We are telling Chart.js, "We plan to use a Bar chart,
 * so please load the scales, the bar element, and the tooltips."
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * StatsChart Component
 *
 * Renders a Bar chart using the 'chartData' prop.
 * This data is prepared and passed down from App.js.
 */
function StatsChart({ chartData }) {
  
  // Configuration options for the chart
  const options = {
    responsive: true, // Make it responsive
    maintainAspectRatio: false, // Allow it to fill the container height
    plugins: {
      legend: {
        position: 'top', // Position the legend at the top
        labels: {
          color: '#e2e8f0' // Set legend text color (Tailwind 'gray-200')
        }
      },
      title: {
        display: false, // We have our own title in App.js
      },
    },
    scales: {
      // Y-axis configuration
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8', // Set Y-axis labels color (Tailwind 'slate-400')
          stepSize: 5, // Count by 5s
        },
        grid: {
          color: '#334155' // Set Y-axis grid lines color (Tailwind 'slate-700')
        }
      },
      // X-axis configuration
      x: {
        ticks: {
          color: '#94a3b8', // Set X-axis labels color (Tailwind 'slate-400')
        },
        grid: {
          color: '#334155' // Set X-axis grid lines color (Tailwind 'slate-700')
        }
      }
    }
  };

  return (
    // We set a fixed height for the chart container
    // 'h-[350px]' is a Tailwind class for 350 pixels
    <div className="relative h-[350px] w-full">
      <Bar options={options} data={chartData} />
    </div>
  );
}

export default StatsChart;