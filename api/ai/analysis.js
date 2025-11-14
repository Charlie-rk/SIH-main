import { pipeline } from '@xenova/transformers';
/**
 * --- AI MODEL 1: SENTIMENT ANALYSIS (for DGP Dashboard) ---
 *
 * Singleton pattern to load the model only once.
 */
/**
 * AI/ML Module for CCTNS "Good Work Done" Dashboard
 *
 * This module provides two key AI features for the DGP Dashboard:
 * 1. AI-Generated Summary (NLG)
 * 2. Performance Forecasting (Time-Series)
 */

/**
 * 1. AI-Generated Summary (NLG)
 * This function takes the top performers and generates a plain-English summary.
 */
export function generateAISummary(topDistricts) {
  // topDistricts = { conviction: { district: 'Ganjam', value: 62 }, nbw: {...}, narcotics: {...} }
  try {
    const { conviction, nbw, narcotics } = topDistricts;

    // A simple template for Natural Language Generation (NLG)
    const summary = `
      This month, **${conviction.district}** led the state with the highest conviction rate at **${conviction.value}%**. 
      In special drives, **${nbw.district}** showed top performance in NBW execution, clearing **${nbw.value}** warrants.
      **${narcotics.district}** was the leader in narcotics enforcement, seizing **${narcotics.value} kg** of Ganja.
      These districts demonstrate exceptional performance in key focus areas.
    `;
    return summary.replace(/\s+/g, ' ').trim(); // Clean up whitespace
  } catch (e) {
    console.error("AI Summary Error:", e);
    return "AI Summary generation failed.";
  }
}

/**
 * 2. Performance Forecasting (ML)
 * This function uses simple linear regression to predict a future value.
 * This is our "AI/ML Insights" feature for 'Districts to Watch'.
 */
function simpleLinearRegression(data) {
  // Data is an array of [x, y] pairs, e.g., [ [1, 10], [2, 12], [3, 15] ]
  if (data.length < 2) return { m: 0, b: data[0] ? data[0][1] : 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = data.length;

  data.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / n;

  return { m, b }; // m = slope, b = y-intercept
}

export function getPerformanceForecast(districtData, metric) {
  // districtData is an array of { district, year, month, [metric]: value }
  try {
    const alerts = [];

    // 1. Get all unique districts
    const districts = [...new Set(districtData.map(d => d.district))];

    districts.forEach(district => {
      // 2. Get data for this district, sorted by time
      const dataPoints = districtData
        .filter(d => d.district === district)
        .sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month))
        .map((d, index) => [index + 1, d[metric]]); // Format as [x, y]

      if (dataPoints.length < 2) return; // Not enough data

      // 3. Create the ML model (linear regression)
      const { m: slope, b } = simpleLinearRegression(dataPoints);

      // 4. Make a prediction for the next month (x = n + 1)
      const nextX = dataPoints.length + 1;
      const prediction = slope * nextX + b;
      
      const lastValue = dataPoints[dataPoints.length - 1][1];
      const change = (prediction - lastValue) / lastValue;

      // 5. Generate the "Smart Alert"
      if (slope > 0 && change > 0.1) { // If trend is positive and > 10%
        alerts.push({
          type: 'red',
          text: `🔴 ALERT: **${district}'s** ${metric.replace(/_/g, ' ')} is forecast to rise by **${(change * 100).toFixed(0)}%** next month based on current trends. Needs attention.`
        });
      } else if (slope < 0 && change < -0.1) {
         alerts.push({
          type: 'green',
          text: `🟢 TREND: **${district}'s** ${metric.replace(/_/g, ' ')} is on a downward trend, forecast to decrease by **${Math.abs((change * 100).toFixed(0))}%**. Investigate for best practices.`
        });
      }
    });

    return alerts;
  } catch (e) {
    console.error("AI Forecast Error:", e);
    return [{ type: 'yellow', text: 'AI Forecast model failed to run.' }];
  }
}