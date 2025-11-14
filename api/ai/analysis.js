/**
 * AI/ML Module for CCTNS "Good Work Done" Dashboard
 *
 * This module provides the three key AI features as required by PS-3:
 * 1. AI-Generated Summary (NLG)
 * 2. Performance Forecasting (Time-Series)
 * 3. AI-Powered PDF Report Parser (NLP/Regex) - [NEWLY ADDED]
 */

/**
 * 1. AI-Generated Summary (Natural Language Generation)
 */
export function generateAISummary(topDistricts) {
  // ... (This function is unchanged)
  try {
    const { conviction, nbw, narcotics } = topDistricts;
    const summary = `
      This month's report: **${conviction.district}** led the state with the highest conviction rate at **${conviction.value}%**. 
      In special drives, **${nbw.district}** showed top performance in NBW execution, clearing **${nbw.value}** warrants.
      **${narcotics.district}** was the leader in narcotics enforcement, seizing **${narcotics.value} kg** of Ganja.
      These districts demonstrate exceptional performance in key focus areas.
    `;
    return summary.replace(/\s+/g, ' ').trim();
  } catch (e) {
    console.error("AI Summary Error:", e);
    return "AI Summary generation failed.";
  }
}

/**
 * 2. Performance Forecasting (Machine Learning)
 */
function simpleLinearRegression(data) {
  // ... (This function is unchanged)
  if (data.length < 2) return { m: 0, b: data[0] ? data[0][1] : 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = data.length;
  data.forEach(([x, y]) => {
    sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
  });
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

// export function getPerformanceForecast(districtData, metric) {
//   try {
//     if (!Array.isArray(districtData) || districtData.length === 0) return [];

//     // local linear regression helper (returns slope m and intercept b)
//     function simpleLinearRegression(points) {
//       // points: [[x1,y1], [x2,y2], ...]
//       const n = points.length;
//       let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
//       for (const [x, y] of points) {
//         sumX += x;
//         sumY += y;
//         sumXY += x * y;
//         sumX2 += x * x;
//       }
//       const meanX = sumX / n;
//       const meanY = sumY / n;
//       const denom = sumX2 - sumX * meanX;
//       const m = denom === 0 ? 0 : (sumXY - sumX * meanY) / denom;
//       const b = meanY - m * meanX;
//       return { m, b };
//     }

//     const groups = new Map();

//     // Normalize & collect numeric values per district with parsed dates
//     for (const row of districtData) {
//       const district = row.district || row.District || 'Unknown';
//       // parse date from (year, month) or "YYYY-MM" or row.date
//       let date = null;
//       if (row.year !== undefined && row.month !== undefined) {
//         const yr = Number(row.year);
//         const mo = Number(row.month);
//         if (!Number.isNaN(yr) && !Number.isNaN(mo)) date = new Date(yr, mo - 1);
//       } else if (typeof row.month === 'string' && /^\d{4}-\d{2}$/.test(row.month)) {
//         const [yrS, moS] = row.month.split('-');
//         const yr = Number(yrS), mo = Number(moS);
//         if (!Number.isNaN(yr) && !Number.isNaN(mo)) date = new Date(yr, mo - 1);
//       } else if (row.date) {
//         const d = new Date(row.date);
//         if (!Number.isNaN(d.getTime())) date = d;
//       }

//       const rawVal = row[metric];
//       const val = rawVal === null || rawVal === undefined ? NaN : Number(rawVal);
//       if (!Number.isFinite(val)) continue; // skip non-numeric metric values

//       if (!groups.has(district)) groups.set(district, []);
//       groups.get(district).push({ date, val });
//     }

//     const alerts = [];

//     for (const [district, records] of groups.entries()) {
//       // sort by date if available; otherwise preserve insertion order
//       records.sort((a, b) => {
//         if (a.date && b.date) return a.date - b.date;
//         if (a.date) return -1;
//         if (b.date) return 1;
//         return 0;
//       });

//       // map to sequential x (1,2,3...) and numeric y
//       const dataPoints = records.map((r, idx) => [idx + 1, r.val]).filter(p => Number.isFinite(p[1]));
//       if (dataPoints.length < 2) continue;

//       const { m: slope } = simpleLinearRegression(dataPoints);
//       const lastValue = dataPoints[dataPoints.length - 1][1];
//       if (!Number.isFinite(lastValue) || lastValue === 0) continue; // avoid divide-by-zero & meaningless ratio

//       // percent change per one time-step (one month index)
//       const changeFraction = slope / lastValue;
//       const metricName = metric.replace(/_/g, ' ');

//       // threshold: >10% increase or <-10% decrease
//       if (slope > 0 && changeFraction > 0.03) {
//         alerts.push({
//           type: 'red',
//           text: `🔴 ALERT: **${district}**'s ${metricName} is forecast to rise by ${(changeFraction * 100).toFixed(0)}% next month based on current trends. Needs attention.`
//         });
//       } else if (slope < 0 && changeFraction < -0.03) {
//         alerts.push({
//           type: 'green',
//           text: `🟢 TREND: **${district}**'s ${metricName} is on a strong downward trend, forecast to decrease by ${Math.abs((changeFraction * 100).toFixed(0))}%. Investigate for best practices.`
//         });
//       }
//     }

//     // optional: sort alerts so red first (you can remove if undesired)
//     alerts.sort((a, b) => {
//       const order = { red: 0, yellow: 1, green: 2 };
//       return (order[a.type] || 3) - (order[b.type] || 3);
//     });

//     return alerts;
//   } catch (e) {
//     console.error("AI Forecast Error:", e);
//     return [{ type: 'yellow', text: 'AI Forecast model failed to run.' }];
//   }
// }

/**
 * getPerformanceForecast
 *
 * Returns a rich object with:
 * - alerts: array of alert objects for UI (type + text)
 * - diagnostics: per-district technical details (useful for debugging / UI drill-down)
 * - summary: totals (num districts processed, alerts by type)
 * - warnings: non-fatal issues encountered
 *
 * Params:
 * - districtData: array of rows (expects fields like district, year+month OR month "YYYY-MM" OR date, and metric)
 * - metric: string metric key to evaluate (e.g., 'pendency_percentage')
 * - options: { increaseThreshold, decreaseThreshold, minPoints, verbose }
 */
export function getPerformanceForecast(districtData = [], metric = 'pendency_percentage', options = {}) {
  const {
    increaseThreshold = 0.10,   // fraction (10% default) -> alert if projected change > +10%
    decreaseThreshold = -0.10,  // fraction (-10% default) -> alert if projected change < -10%
    minPoints = 2,              // min points for regression
    verbose = false             // include extra text in alerts
  } = options;

  const result = {
    alerts: [],
    diagnostics: {}, // keyed by district
    summary: { processed: 0, skipped: 0, alerts: { red: 0, green: 0, yellow: 0 } },
    warnings: []
  };

  if (!Array.isArray(districtData) || districtData.length === 0) {
    result.warnings.push('No districtData provided or empty array.');
    return result;
  }

  // Use external simpleLinearRegression if available, otherwise fallback to local implementation
  const regression = (typeof simpleLinearRegression === 'function')
    ? ((points) => {
        // adapt external function shape if necessary (expecting [[x,y],...])
        try { return simpleLinearRegression(points); } catch (e) { /* fallback below */ }
        return localRegression(points);
      })
    : localRegression;

  function localRegression(points) {
    // points: [[x,y], ...]
    const n = points.length;
    if (n < 2) return { m: 0, b: points[0] ? points[0][1] : 0 };
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const [x, y] of points) {
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    }
    const meanX = sumX / n;
    const meanY = sumY / n;
    const denom = sumX2 - sumX * meanX;
    const m = denom === 0 ? 0 : (sumXY - sumX * meanY) / denom;
    const b = meanY - m * meanX;
    return { m, b };
  }

  // Helper: parse date from common shapes
  function parseDateFromRow(row) {
    if (row.year !== undefined && row.month !== undefined) {
      const yr = Number(row.year), mo = Number(row.month);
      if (!Number.isNaN(yr) && !Number.isNaN(mo)) return new Date(yr, mo - 1);
    }
    if (typeof row.month === 'string' && /^\d{4}-\d{2}$/.test(row.month)) {
      const [yrS, moS] = row.month.split('-');
      const yr = Number(yrS), mo = Number(moS);
      if (!Number.isNaN(yr) && !Number.isNaN(mo)) return new Date(yr, mo - 1);
    }
    if (row.date) {
      const d = new Date(row.date);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
  }

  // Group rows by district (normalize key)
  const groups = new Map();
  for (const row of districtData) {
    const district = row.district || row.District || 'Unknown';
    const date = parseDateFromRow(row);
    const rawVal = row[metric];
    const val = rawVal === null || rawVal === undefined ? NaN : Number(rawVal);
    if (!Number.isFinite(val)) {
      // skip rows with non-numeric metric but add a warning entry (only once per district)
      if (!result.diagnostics[district]) {
        result.diagnostics[district] = { warnings: [], rawRows: [] };
      }
      result.diagnostics[district].warnings = result.diagnostics[district].warnings || [];
      result.diagnostics[district].warnings.push(`Skipped non-numeric metric value: ${rawVal}`);
      // still record rawRow to help debug
      result.diagnostics[district].rawRows = result.diagnostics[district].rawRows || [];
      result.diagnostics[district].rawRows.push(row);
      continue;
    }
    if (!groups.has(district)) groups.set(district, []);
    groups.get(district).push({ date, val, raw: row });
  }

  // Process each district
  for (const [district, records] of groups.entries()) {
    const diag = {
      sampleCount: 0,
      slope: null,
      intercept: null,
      lastValue: null,
      projectedNextValue: null,
      projectedPercentChange: null,
      alert: null,
      reasonSkipped: null,
      rawRows: records.map(r => r.raw)
    };

    // sort by date if present, otherwise leave insertion order
    records.sort((a, b) => {
      if (a.date && b.date) return a.date - b.date;
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });

    const dataPoints = records.map((r, idx) => [idx + 1, r.val]).filter(p => Number.isFinite(p[1]));
    diag.sampleCount = dataPoints.length;

    if (dataPoints.length === 0) {
      diag.reasonSkipped = 'No numeric data points for metric';
      result.diagnostics[district] = diag;
      result.summary.skipped += 1;
      continue;
    }

    // Single-point fallback: use thresholds on raw value
    if (dataPoints.length < minPoints) {
      const value = dataPoints[dataPoints.length - 1][1];
      diag.lastValue = value;

      // heuristic thresholds for single point (these can be tuned via options)
      // we'll use increaseThreshold/decreaseThreshold as percent fractions but treat them as absolute % if values look like percentages
      // If metric looks like percentage (value <= 100 and value >= -10), treat it as percent (0-100)
      let alerted = false;
      if (value >= 0 && value <= 100) {
        // percent-like
        if (value >= Math.max(30, increaseThreshold * 100)) {
          diag.alert = { type: 'red', reason: `single_point_percent >= ${Math.max(30, increaseThreshold * 100)}%` };
          result.alerts.push({
            type: 'red',
            text: `🔴 ALERT: **${district}** has a high ${metric.replace(/_/g, ' ')} of ${value}%. Needs attention.`,
            district, metric, value
          });
          result.summary.alerts.red += 1;
          alerted = true;
        } else if (value <= Math.min(10, Math.abs(decreaseThreshold) * 100)) {
          diag.alert = { type: 'green', reason: `single_point_percent <= ${Math.min(10, Math.abs(decreaseThreshold) * 100)}%` };
          result.alerts.push({
            type: 'green',
            text: `🟢 TREND: **${district}** shows a low ${metric.replace(/_/g, ' ')} of ${value}%. Good performance.`,
            district, metric, value
          });
          result.summary.alerts.green += 1;
          alerted = true;
        }
      } else {
        // not percent-like: only warn if value is obviously large (fallback heuristic)
        if (value > (increaseThreshold * (value || 1))) {
          // not meaningful to compare; skip
        }
      }

      if (!alerted) {
        diag.reasonSkipped = 'Single sample and not meeting single-point thresholds';
        result.summary.skipped += 1;
      }
      result.diagnostics[district] = diag;
      result.summary.processed += 1;
      continue;
    }

    // >= minPoints: perform regression
    const { m: slope, b: intercept } = regression(dataPoints);
    const lastValue = dataPoints[dataPoints.length - 1][1];

    diag.slope = Number(slope);
    diag.intercept = Number(intercept);
    diag.lastValue = Number(lastValue);

    if (!Number.isFinite(lastValue) || lastValue === 0) {
      diag.reasonSkipped = 'Last value is zero or not finite; cannot compute percent change safely';
      result.diagnostics[district] = diag;
      result.summary.skipped += 1;
      continue;
    }

    // Project one time-step ahead (x + 1)
    const projectedNextValue = lastValue + slope;
    const projectedPercentChange = slope / lastValue; // fraction relative to last value

    diag.projectedNextValue = Number(projectedNextValue);
    diag.projectedPercentChange = Number(projectedPercentChange);

    // Decide alerts using thresholds
    if (slope > 0 && projectedPercentChange > increaseThreshold) {
      const pct = (projectedPercentChange * 100).toFixed(0);
      const alertObj = {
        type: 'red',
        text: `🔴 ALERT: **${district}**'s ${metric.replace(/_/g, ' ')} is forecast to rise by ${pct}% next month (proj: ${projectedNextValue.toFixed(2)} from ${lastValue}).`,
        district, metric, slope, lastValue, projectedNextValue, projectedPercentChange
      };
      result.alerts.push(alertObj);
      diag.alert = { type: 'red', reason: `slope>0 and projectedPercentChange>${increaseThreshold}` };
      result.summary.alerts.red += 1;
    } else if (slope < 0 && projectedPercentChange < decreaseThreshold) {
      const pct = Math.abs((projectedPercentChange * 100).toFixed(0));
      const alertObj = {
        type: 'green',
        text: `🟢 TREND: **${district}**'s ${metric.replace(/_/g, ' ')} is forecast to decrease by ${pct}% next month (proj: ${projectedNextValue.toFixed(2)} from ${lastValue}).`,
        district, metric, slope, lastValue, projectedNextValue, projectedPercentChange
      };
      result.alerts.push(alertObj);
      diag.alert = { type: 'green', reason: `slope<0 and projectedPercentChange<${decreaseThreshold}` };
      result.summary.alerts.green += 1;
    } else {
      // no alert
      diag.reasonSkipped = 'Regression result does not exceed thresholds';
      result.summary.skipped += 1;
    }

    // include regression diagnostics
    result.diagnostics[district] = diag;
    result.summary.processed += 1;
  } // end for each district

  // sort alerts: red first
  result.alerts.sort((a, b) => {
    const ord = { red: 0, yellow: 1, green: 2 };
    return (ord[a.type] || 3) - (ord[b.type] || 3);
  });

  // nice summary counts
  result.summary.totalDistricts = Array.from(groups.keys()).length;
  result.summary.totalAlerts = result.alerts.length;

  // verbose mode: add some text hints
  if (verbose) {
    result.warnings.push('Verbose diagnostics included. Use diagnostics[district] for per-district details.');
  }

  return result;
}



/**
 * --- [NEW AI/NLP FEATURE] ---
 * 3. AI-Powered PDF Report Parser (NLP/Regex)
 *
 * This function takes raw text extracted from a PDF and uses
 * Regular Expressions to find and extract the data points
 * from the "NBW Drive" report (image_439ba6.png).
 */
export function parseNbwPdfText(rawText) {
  const data = {};
  
  // Helper function to find a number after a specific text pattern
  // This is a simple form of NLP (Named Entity Recognition)
  const findValue = (regex) => {
    // We remove commas from numbers (e.g., "1,500" -> 1500) to ensure parsing
    const cleanText = rawText.replace(/,/g, '');
    const match = cleanText.match(regex);
    
    // [1] is the first capture group (the number)
    return match && match[1] ? parseInt(match[1], 10) : 0;
  };

  // Define regex patterns based on the columns in image_439ba6.png
  // These patterns are robust to whitespace (\s+) and newlines
  
  // Example pattern: "pending as on 01.08.2025" followed by a number
  data.pending_start_of_month = findValue(/pending\s+as\s+on\s+[\d.]+\s+([\d]+)/i);
  data.received_this_month = findValue(/NBW\s+received\s+([\d]+)/i);
  data.total_nbw = findValue(/Total\s+NBW\s+([\d]+)/i);
  
  data.executed_gr_cases = findValue(/In\s+GR\s+cases\s+([\d]+)/i);
  data.executed_st_cases = findValue(/In\s+ST\s+cases\s+([\d]+)/i);
  data.executed_other_cases = findValue(/In\s+other\s+cases\s+([\d]+)/i);
  
  // Find "Total" that comes just before "Recalled"
  data.executed_total = findValue(/Total\s+([\d]+)\s+Recalled/i);
  
  data.disposed_recalled = findValue(/Recalled\s+([\d]+)/i);
  data.disposed_returned = findValue(/Returned\s+([\d]+)/i);
  
  // Find "Total" that comes just before "Total disposed off"
  data.disposed_total = findValue(/Total\s+([\d]+)\s+Total\s+disposed\s+off/i);
  
  data.total_disposed_off = findValue(/Total\s+disposed\s+off\s+([\d]+)/i);
  
  // Find "pending as on" for the *end* of the month
  const allPendingMatches = [...rawText.matchAll(/NBW\s+s\s+pending\s+as\s+on\s+[\d.]+\s+([\d]+)/gi)];
  if (allPendingMatches.length > 0) {
    // Get the *last* match, which should be the end-of-month total
    data.pending_end_of_month = parseInt(allPendingMatches[allPendingMatches.length - 1][1].replace(/,/g, ''), 10);
  } else {
    data.pending_end_of_month = 0;
  }

  data.executed_old_cases = findValue(/pending\s+2023\s+or\s+before\.\s+([\d]+)/i);

  console.log("[AI Parser] Parsed PDF data:", data);
  return data;
}