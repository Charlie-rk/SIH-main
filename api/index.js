import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
// --- NEW IMPORTS ---
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

import xlsx from 'xlsx';

// Import our new CCTNS-specific AI functions
import { 
  generateAISummary, 
  getPerformanceForecast,
  parseNbwPdfText // --- NEW AI IMPORT ---
} from './ai/analysis.js';


// --- 1. DATA LOADING ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LATEST_MONTH =9;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });




// Helper function to load our JSON files robustly
function loadJsonFile(filename) {
  try {
    const dataPath = path.join(__dirname, filename);
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    console.log(`[Server] Successfully loaded ${filename}`);
    return JSON.parse(fileContents);
  } catch (err) {
    console.error(`[Server] CRITICAL ERROR: Could not read ${filename}.`);
    console.error(err);
    process.exit(1); // Exit if critical data is missing
  }
}

// Load all 7 new CCTNS data files
const convictionsDb = loadJsonFile('cctns_convictions.json');
const nbwDb = loadJsonFile('cctns_nbw.json');
const firearmsDb = loadJsonFile('cctns_firearms.json');
const sandMiningDb = loadJsonFile('cctns_sand_mining.json');
const missingPersonsDb = loadJsonFile('cctns_missing_persons.json');
const pendencyDb = loadJsonFile('cctns_pendency.json');
const preventiveDb = loadJsonFile('cctns_preventive_drives.json');

// We still need our users file
const usersDb = loadJsonFile('users.json');

// Secret key for JWT. In a real app, this MUST be in a .env file.
const JWT_SECRET = "YOUR_HACKATHON_SECRET_KEY";

// --- 2. APP INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 8000;

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 3.5 NEW: MULTER SETUP ---
// Configure Multer to store uploaded files in a temp 'uploads/' directory
const upload = multer({ dest: UPLOAD_DIR });

// --- 4. AUTHENTICATION (Using plain text as fixed) ---

// Login endpoint (Public)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[Auth] Login attempt: User: ${username}`);
  
  const user = usersDb.find(u => u.username === username);
  if (!user) {
    console.log(`[Auth] FAILED: User not found.`);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // Plain text password check
  const isMatch = (password === user.password);
  if (!isMatch) {
    console.log(`[Auth] FAILED: Password incorrect.`);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // Create a JWT Token
  const userPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    district: user.district
  };

  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });

  console.log(`[Auth] SUCCESS: Token generated for ${user.username}.`);
  res.json({ token, user: userPayload });
});

// Auth Middleware (To protect routes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- 5. NEW SECURED API ENDPOINTS (CCTNS) ---

// === DGP (STATE-LEVEL) DASHBOARD ENDPOINTS ===

/**
 * Feature: AI-Generated "Monthly Performance Summary" (NLP/NLG)
 */
app.get('/api/ai/monthly_summary', authenticateToken, (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);

  const latestMonth = 9;
  
  const topConviction = convictionsDb
    .filter(d => d.month === latestMonth)
    .sort((a, b) => b.ipc_bns_conviction_rate - a.ipc_bns_conviction_rate)[0];

  const topNBW = nbwDb
    .filter(d => d.month === latestMonth)
    .sort((a, b) => b.executed_total - a.executed_total)[0];

  const topNarcotics = preventiveDb
    .filter(d => d.month === latestMonth)
    .sort((a, b) => b.narcotics_seizure_ganja_kg - a.narcotics_seizure_ganja_kg)[0];
    
  const topDistricts = {
    conviction: { district: topConviction.district, value: topConviction.ipc_bns_conviction_rate.toFixed(1) },
    nbw: { district: topNBW.district, value: topNBW.executed_total },
    narcotics: { district: topNarcotics.district, value: topNarcotics.narcotics_seizure_ganja_kg.toFixed(0) }
  };

  const summary = generateAISummary(topDistricts);
  res.json({ summary });
});

/**
 * Feature: Performance Forecasting (ML "Districts to Watch")
 */
app.get('/api/ai/performance_forecast', (req, res) => {
  // if (req.user.role !== 'DGP') return res.sendStatus(403);
  
  const alerts = getPerformanceForecast(pendencyDb, 'pendency_percentage');
  res.json(alerts);
});

/**
 * Feature: "Special Drive" Leaderboards
 */
app.get('/api/drives/leaderboard/:metric', authenticateToken, (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);
  
  const { metric } = req.params;
  const latestMonth = 9;
  let db;
  let key = metric;
  
  if (metric.startsWith('firearms_')) {
    db = firearmsDb;
    key = 'total_firearms_seized';
  } else if (metric.startsWith('sand_')) {
    db = sandMiningDb;
    key = 'cases_registered';
  } else if (metric.startsWith('narcotics_') || metric.startsWith('excise_') || metric.startsWith('opg_')) {
    db = preventiveDb;
  } else if (metric.startsWith('nbw_')) {
    db = nbwDb;
    key = 'executed_total';
  } else {
    return res.status(400).json({ error: 'Invalid metric' });
  }

  const data = db.filter(d => d.month === latestMonth)
    .map(d => {
      let value = 0;
      if (metric === 'firearms_seized') {
        value = (d.seizure_gun_rifle + d.seizure_pistol + d.seizure_revolver + 
                 d.seizure_mouzer + d.seizure_ak_47 + d.seizure_slr + d.seizure_others);
      } else {
        value = d[key] || 0;
      }
      return { district: d.district, value };
    })
    .sort((a, b) => b.value - a.value);

  res.json(data);
});

/**
 * Feature: Conviction Rate Leaderboard
 */
app.get('/api/analytics/conviction_rates', authenticateToken, (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);
  
  const latestMonth = 9;
  const rates = convictionsDb
    .filter(d => d.month === latestMonth)
    .map(d => ({
      district: d.district,
      rate: d.ipc_bns_conviction_rate
    }))
    .sort((a, b) => b.rate - a.rate);
    
  res.json(rates);
});

/**
 * Feature: GIS / Geo-Analytics Map Data
 */
app.get('/api/analytics/map_data', authenticateToken, (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);

  const latestMonth = 9;
  const metricsMap = {};

  convictionsDb.filter(d => d.month === latestMonth).forEach(d => {
    metricsMap[d.district] = {
      conviction_rate: d.ipc_bns_conviction_rate,
      nbw_executed: 0,
      narcotics_ganja_kg: 0,
      firearms_seized: 0
    };
  });

  nbwDb.filter(d => d.month === latestMonth).forEach(d => {
    if (metricsMap[d.district]) {
      metricsMap[d.district].nbw_executed = d.executed_total;
    }
  });
  
  preventiveDb.filter(d => d.month === latestMonth).forEach(d => {
    if (metricsMap[d.district]) {
      metricsMap[d.district].narcotics_ganja_kg = d.narcotics_seizure_ganja_kg;
    }
  });

  firearmsDb.filter(d => d.month === latestMonth).forEach(d => {
    if (metricsMap[d.district]) {
      metricsMap[d.district].firearms_seized = 
        d.seizure_gun_rifle + d.seizure_pistol + d.seizure_revolver + 
        d.seizure_mouzer + d.seizure_ak_47 + d.seizure_slr + d.seizure_others;
    }
  });
  
  res.json(metricsMap);
});


// === SP (DISTRICT-LEVEL) DASHBOARD ENDPOINTS ===

/**
 * Feature: Get all data for a single district (for SP form pre-fill)
 */
app.get('/api/district_data/:district/:month', authenticateToken, (req, res) => {
  const { district } = req.params;
  const m = parseInt(req.params.month, 10);
  
  if (req.user.role === 'SP' && req.user.district.toLowerCase() !== district.toLowerCase()) {
    return res.status(403).json({ error: "Access denied." });
  }
  
  const data = {
    convictions: convictionsDb.find(d => d.district === district && d.month === m) || {},
    nbw: nbwDb.find(d => d.district === district && d.month === m) || {},
    firearms: firearmsDb.find(d => d.district === district && d.month === m) || {},
    sand_mining: sandMiningDb.find(d => d.district === district && d.month === m) || {},
    missing_persons: missingPersonsDb.find(d => d.district === district && d.month === m) || {},
    pendency: pendencyDb.find(d => d.district === district && d.month === m) || {},
    preventive: preventiveDb.find(d => d.district === district && d.month === m) || {}
  };
  
  res.json(data);
});

/**
 * Feature: Submit "Good Work Done" Report
 */
app.post('/api/cctns/report', authenticateToken, (req, res) => {
  if (req.user.role !== 'SP') return res.sendStatus(403);
  
  const reportData = req.body;
  console.log(`[Server] Received CCTNS report submission from SP ${req.user.username} for district ${req.user.district}`);
  console.log(reportData);
  
  res.json({ status: "success", message: "Report submitted successfully." });
});

/**
 * NEW Feature: AI-Powered "Smart Upload"
 * Handles PDF, Excel for the NBW report.
 */
app.post('/api/cctns/upload/nbw', authenticateToken, upload.single('reportFile'), async (req, res) => {
  if (req.user.role !== 'SP') return res.sendStatus(403);
  
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded.' });

  let parsedData = {};

  try {
    // --- HANDLE PDF (The AI/NLP Path) ---
    if (file.mimetype === 'application/pdf') {
  const dataBuffer = fs.readFileSync(file.path);
  // change from: const pdfData = await pdf.default(dataBuffer);
  const pdfData = await pdf(dataBuffer);
  parsedData = parseNbwPdfText(pdfData.text);
} else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // This assumes the data is in the second row (index 1)
      const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      const row = json[1]; // Get the first data row
      parsedData = {
        pending_start_of_month: row[1], received_this_month: row[2], total_nbw: row[3],
        executed_gr_cases: row[4], executed_st_cases: row[5], executed_other_cases: row[6],
        executed_total: row[7], disposed_recalled: row[8], disposed_returned: row[9],
        disposed_total: row[10], total_disposed_off: row[11], pending_end_of_month: row[12],
        executed_old_cases: row[13]
      };
    
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or XLSX.' });
    }

    // Send the parsed JSON data *back* to the frontend
    res.json({ data: parsedData, message: 'File parsed successfully! Form has been pre-filled.' });

  } catch (err) {
    console.error("File parsing error:", err);
    res.status(500).json({ error: "Failed to parse the file." });
  } finally {
  try {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  } catch (e) {
    console.warn('[Server] Failed to delete temp file:', e.message);
  }
}
});




// --- Existing endpoints you provided ---
// (I assume you have them already; paste them here if needed.)
// For brevity I omit re-pasting everything you already have (monthly_summary, performance_forecast, drives/leaderboard, analytics/conviction_rates, analytics/map_data, district_data, cctns/report, upload/nbw) — they remain unchanged.

// ----------------------------------------------------------------
// ------------------- NEW: Trend Analysis Endpoints ----------------
// ----------------------------------------------------------------

/**
 * Helper: getMonthKey
 */
function getMonthKey(year, month) {
  const mm = String(month).padStart(2, '0');
  return `${year}-${mm}`;
}

/**
 * Helper: buildMonthsList
 * Accepts `months` as integer (last N months) or from/to range via query params.
 */
function buildMonthsList({ months = 6, from, to }) {
  // months default is last N months ending at latest data month found in db
  // find latest year/month across DBs:
  const allEntries = [...convictionsDb, ...nbwDb, ...firearmsDb, ...preventiveDb, ...sandMiningDb, ...pendencyDb, ...missingPersonsDb];
  const latest = allEntries.reduce((acc, d) => {
    if (!d || !d.year || !d.month) return acc;
    const ym = d.year * 100 + d.month;
    if (ym > acc) return ym;
    return acc;
  }, 0);

  let endYear = Math.floor(latest / 100);
  let endMonth = latest % 100;

  if (from && to) {
    // parse from/to strings "YYYY-MM"
    const parseYm = (s) => {
      const parts = s.split('-').map(Number);
      return { y: parts[0], m: parts[1] };
    };
    const f = parseYm(from), t = parseYm(to);
    const monthsList = [];
    let cy = f.y, cm = f.m;
    while (cy < t.y || (cy === t.y && cm <= t.m)) {
      monthsList.push(getMonthKey(cy, cm));
      cm++;
      if (cm > 12) { cm = 1; cy++; }
    }
    return monthsList;
  }

  // default last `months` months ending at latest
  const result = [];
  let cy = endYear, cm = endMonth;
  for (let i = 0; i < months; i++) {
    result.unshift(getMonthKey(cy, cm)); // unshift to get chronological order
    cm--;
    if (cm < 1) { cm = 12; cy--; }
  }
  return result;
}

/**
 * Helper: getValueForMetricFromEntry
 * Extract numeric value for a metric key from a record object.
 * Supports:
 *  - 'narcotics_ganja_kg' -> preventiveDb entry field 'narcotics_seizure_ganja_kg'
 *  - 'narcotics_brownsugar_gm' -> preventiveDb entry 'narcotics_seizure_brownsugar_gm'
 *  - 'nbw_executed' -> nbwDb.executed_total
 *  - 'firearms_seized' -> sum of firearms fields in firearmsDb
 *  - 'conviction_rate' -> convictionsDb.ipc_bns_conviction_rate
 *  - 'sand_cases' -> sandMiningDb.cases_registered
 */
function getMetricValueFromRecord(metric, record) {
  if (!record) return 0;
  switch (metric) {
    case 'narcotics_ganja_kg':
      return Number(record.narcotics_seizure_ganja_kg || record.narcotics_seizure_ganja || 0);
    case 'narcotics_brownsugar_gm':
      return Number(record.narcotics_seizure_brownsugar_gm || record.narcotics_seizure_brownsugar || 0);
    case 'nbw_executed':
      return Number(record.executed_total || record.preventive_nbw_executed || 0);
    case 'firearms_seized':
      return (Number(record.seizure_gun_rifle || 0) +
              Number(record.seizure_pistol || 0) +
              Number(record.seizure_revolver || 0) +
              Number(record.seizure_mouzer || 0) +
              Number(record.seizure_ak_47 || 0) +
              Number(record.seizure_slr || 0) +
              Number(record.seizure_others || 0));
    case 'conviction_rate':
      return Number(record.ipc_bns_conviction_rate || record.conviction_rate || 0);
    case 'sand_cases':
      return Number(record.cases_registered || 0);
    default:
      // attempt to pick the first numeric-looking field
      for (const k in record) {
        if (typeof record[k] === 'number') return record[k];
        if (typeof record[k] === 'string' && record[k].match(/^\d+(\.\d+)?$/)) return Number(record[k]);
      }
      return 0;
  }
}

/**
 * GET /api/trends/:metric
 * Returns: months[], series[] where each series is { district, values: [v1,v2,...], total }
 * Query params:
 *  - months (int, optional, default 6)
 *  - top (int, optional) -> returns series limited to top N by total
 *  - from, to (optional "YYYY-MM" strings) -> overrides months
 */
app.get('/api/trends/:metric', (req, res) => {
  console.log("Hiiiiiii2\n");

  // allow both DGP and SP to call (SP can be filtered on district by frontend)
  const { metric } = req.params;
  const monthsParam = parseInt(req.query.months, 10) || undefined;
  const topN = parseInt(req.query.top, 10) || undefined;
  const from = req.query.from || undefined;
  const to = req.query.to || undefined;

  const monthsList = buildMonthsList({ months: monthsParam || 6, from, to });

  // Decide which DB to read from depending on metric
  // We'll query all relevant DBs into a map keyed by district and month.
  // Build quick lookup: map[dbName][district][monthKey] => record
  const lookup = {}; // { convictions: {}, nbw: {}, preventive: {}, firearms: {}, sand: {} }

  const addToLookup = (name, db) => {
    lookup[name] = {};
    db.forEach(rec => {
      if (!rec || !rec.district || !rec.year || !rec.month) return;
      const mkey = getMonthKey(rec.year, rec.month);
      if (!lookup[name][rec.district]) lookup[name][rec.district] = {};
      lookup[name][rec.district][mkey] = rec;
    });
  };

  addToLookup('convictions', convictionsDb);
  addToLookup('nbw', nbwDb);
  addToLookup('preventive', preventiveDb);
  addToLookup('firearms', firearmsDb);
  addToLookup('sand', sandMiningDb);

  // Build the set of districts from all lookups
  const districtsSet = new Set();
  [lookup.convictions, lookup.nbw, lookup.preventive, lookup.firearms, lookup.sand].forEach(obj => {
    if (!obj) return;
    Object.keys(obj).forEach(d => districtsSet.add(d));
  });
  const districts = Array.from(districtsSet).sort();

  // For each district, for each month, extract value
  const series = districts.map(district => {
    const values = monthsList.map(mk => {
      // pick appropriate record depending on metric
      let rec = null;
      if (metric === 'conviction_rate') {
        rec = (lookup.convictions && lookup.convictions[district] && lookup.convictions[district][mk]) || null;
      } else if (metric.startsWith('narcotics')) {
        rec = (lookup.preventive && lookup.preventive[district] && lookup.preventive[district][mk]) || null;
      } else if (metric === 'nbw_executed') {
        rec = (lookup.nbw && lookup.nbw[district] && lookup.nbw[district][mk]) || null;
      } else if (metric === 'firearms_seized') {
        rec = (lookup.firearms && lookup.firearms[district] && lookup.firearms[district][mk]) || null;
      } else if (metric === 'sand_cases') {
        rec = (lookup.sand && lookup.sand[district] && lookup.sand[district][mk]) || null;
      } else {
        // fallback: search all in order
        rec = (lookup.preventive && lookup.preventive[district] && lookup.preventive[district][mk]) ||
              (lookup.convictions && lookup.convictions[district] && lookup.convictions[district][mk]) ||
              (lookup.nbw && lookup.nbw[district] && lookup.nbw[district][mk]) ||
              (lookup.firearms && lookup.firearms[district] && lookup.firearms[district][mk]) ||
              (lookup.sand && lookup.sand[district] && lookup.sand[district][mk]) || null;
      }
      const val = getMetricValueFromRecord(metric, rec);
      return Number(val || 0);
    });
    const total = values.reduce((s, v) => s + v, 0);
    return { district, values, total };
  });

  // Optionally sort by total desc and limit topN
  let sorted = series.sort((a, b) => b.total - a.total);
  let returned = sorted;
  if (topN) returned = sorted.slice(0, topN);

  // Best-effort unit detection
  let unit = '';
  if (metric === 'narcotics_ganja_kg') unit = 'kg';
  if (metric === 'narcotics_brownsugar_gm') unit = 'g';
  if (metric === 'firearms_seized') unit = 'count';
  if (metric === 'nbw_executed') unit = 'count';
  if (metric === 'conviction_rate') unit = '%';
  if (metric === 'sand_cases') unit = 'count';

  res.json({ months: monthsList, series: returned, unit });
});

/**
 * GET /api/trends/top/:metric
 * Returns the top `top` districts for the metric across the last `months` months
 */
app.get('/api/trends/top/:metric', (req, res) => {
  console.log("Hiiiiiii2\n");
  const { metric } = req.params;
  const monthsParam = parseInt(req.query.months, 10) || 6;
  const topN = parseInt(req.query.top, 10) || 5;

  const monthsList = buildMonthsList({ months: monthsParam });

  // reuse logic from /api/trends/:metric: sample by calling that logic inline for performance
  // Build lookup again
  const lookup = {};
  const addToLookup = (name, db) => {
    lookup[name] = {};
    db.forEach(rec => {
      if (!rec || !rec.district || !rec.year || !rec.month) return;
      const mkey = getMonthKey(rec.year, rec.month);
      if (!lookup[name][rec.district]) lookup[name][rec.district] = {};
      lookup[name][rec.district][mkey] = rec;
    });
  };
  addToLookup('convictions', convictionsDb);
  addToLookup('nbw', nbwDb);
  addToLookup('preventive', preventiveDb);
  addToLookup('firearms', firearmsDb);
  addToLookup('sand', sandMiningDb);

  const districtsSet = new Set();
  [lookup.convictions, lookup.nbw, lookup.preventive, lookup.firearms, lookup.sand].forEach(obj => {
    if (!obj) return;
    Object.keys(obj).forEach(d => districtsSet.add(d));
  });
  const districts = Array.from(districtsSet);

  const totals = districts.map(district => {
    const values = monthsList.map(mk => {
      let rec = null;
      if (metric === 'conviction_rate') {
        rec = (lookup.convictions && lookup.convictions[district] && lookup.convictions[district][mk]) || null;
      } else if (metric.startsWith('narcotics')) {
        rec = (lookup.preventive && lookup.preventive[district] && lookup.preventive[district][mk]) || null;
      } else if (metric === 'nbw_executed') {
        rec = (lookup.nbw && lookup.nbw[district] && lookup.nbw[district][mk]) || null;
      } else if (metric === 'firearms_seized') {
        rec = (lookup.firearms && lookup.firearms[district] && lookup.firearms[district][mk]) || null;
      } else if (metric === 'sand_cases') {
        rec = (lookup.sand && lookup.sand[district] && lookup.sand[district][mk]) || null;
      } else {
        rec = (lookup.preventive && lookup.preventive[district] && lookup.preventive[district][mk]) ||
              (lookup.convictions && lookup.convictions[district] && lookup.convictions[district][mk]) ||
              (lookup.nbw && lookup.nbw[district] && lookup.nbw[district][mk]) ||
              (lookup.firearms && lookup.firearms[district] && lookup.firearms[district][mk]) || null;
      }
      return getMetricValueFromRecord(metric, rec);
    });
    return { district, total: values.reduce((s, v) => s + (v || 0), 0) };
  });

  const top = totals.sort((a, b) => b.total - a.total).slice(0, topN);
  res.json(top);
});



app.get('/api/reports/good-work-done', authenticateToken, (req, res) => {
  const convictionsLatest = convictionsDb.filter(d => d.month === LATEST_MONTH);
  const firearmsLatest = firearmsDb.filter(d => d.month === LATEST_MONTH);
  console.log("Helo");
  // 1. Merge and Calculate Raw Metrics
  const mergedData = convictionsLatest.map(conv => {
    const firearms = firearmsLatest.find(f => f.district === conv.district);
    
    // Sum all firearm seizure types
    const seizureColumns = ['seizure_gun_rifle', 'seizure_pistol', 'seizure_revolver', 'seizure_mouzer', 'seizure_ak_47', 'seizure_slr', 'seizure_others'];
    const totalFirearmSeized = firearms ? seizureColumns.reduce((sum, col) => sum + (firearms[col] || 0), 0) : 0;
    
    return {
      district: conv.district,
      ConvictionRate: conv.ipc_bns_conviction_rate || 0,
      TotalFirearmSeized: totalFirearmSeized,
    };
  }).filter(d => d.TotalFirearmSeized > 0 || d.ConvictionRate > 0);

  if (mergedData.length === 0) return res.json([]);

  // 2. Normalize and Score
  const convictionRates = mergedData.map(d => d.ConvictionRate);
  const firearmSeizures = mergedData.map(d => d.TotalFirearmSeized);
  
  const maxSeizure = Math.max(...firearmSeizures);
  const minSeizure = Math.min(...firearmSeizures);
  const maxConviction = 100; // Conviction rate maxes at 100

  const report = mergedData.map(d => {
    const normConviction = d.ConvictionRate / maxConviction; 

    let normSeizure = 0;
    if (maxSeizure > minSeizure) {
        normSeizure = (d.TotalFirearmSeized - minSeizure) / (maxSeizure - minSeizure);
    } else if (d.TotalFirearmSeized > 0) {
        // If all districts have the same non-zero seizure, give a base score
        normSeizure = 0.5; 
    }
    
    // Good Work Score: 50% Conviction, 50% Firearm Seizure
    const goodWorkScore = (normConviction * 0.5) + (normSeizure * 0.5);

    return { ...d, GoodWorkScore: goodWorkScore };
  });

  // 3. Final Ranking and Formatting
  report.sort((a, b) => b.GoodWorkScore - a.GoodWorkScore);
  
  const finalReport = report.map((item, index) => ({
    Rank: index + 1,
    District: item.district,
    ConvictionRate: item.ConvictionRate.toFixed(1) + '%',
    FirearmsSeized: item.TotalFirearmSeized,
    GoodWorkScore: (item.GoodWorkScore * 100).toFixed(1) + '%',
  }));

  res.json(finalReport);
});
// --- 6. START THE SERVER ---
app.listen(PORT, async () => {
  console.log(`[Server] Backend server is running on http://localhost:${PORT}`);
  console.log("\n[Server] All 8 CCTNS-compliant data files loaded.");
  console.log("[Server] Ready for connections.");
});