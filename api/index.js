// import  express  from "express";
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import userRoute from "./routes/userRoute.js";
// import authRoute from "./routes/authRoute.js";

// import bookingRoute from './routes/bookingRoute.js';
// import paymentRoute from './routes/paymentRoute.js';
// import notificationRoute from './routes/notificationRoute.js';
// import parcelNotificationRoute from './routes/parcelNotificationRoute.js';
// import parcelRoute from './routes/parcelRoute.js';
// import nodeRoute from './routes/nodeRoutes.js';

// // import pdfDetailsRoute from './routes/pdfDetailsRoute.js';
// import multer from "multer";
// import PdfDetails from "./models/pdfDetails.js";

// import cookieParser from 'cookie-parser';
// import path from 'path';
// import Razorpay from "razorpay";
// dotenv.config();

// const url=process.env.MONGO;
// mongoose.connect("mongodb+srv://hexcodesih:826uZjDSY73lRLcW@cluster0.muwjo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(()=>{
//     console.log("connected to data base");
//     console.log("Connected to mogodb successfully");
// })
// .catch((err)=>{
//     console.log(err);
// })
// const __dirname = path.resolve();

// const app=express();


// app.use(express.json());
// app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded bodies
// app.use(express.static(path.join(__dirname,'/client/dist')))
// app.use(cookieParser());

//   app.get('/api/pay/get-key',(req,res)=>{
//     // console.log("ghgh");
//     console.log({key:process.env.RAZORPAY_API_KEY});
//     res.status(200).json({key:process.env.RAZORPAY_API_KEY});
// })


// // app.use("/api/test", ()=>console.log("HI  sih ki ma ki ankh------------"));

// app.use("/api/user",userRoute);
// app.use("/api/auth",authRoute);
// app.use("/api/bus",bookingRoute);
// app.use("/api/pay",paymentRoute);
// app.use("/api/send",notificationRoute);
// app.use("/api/parcel", parcelRoute);
// app.use("/api/nodes", nodeRoute);
// app.use("/api/parcelNotification", parcelNotificationRoute);
// // app.use("/api/chat",chatbotRoute);
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
//   });

// // app.use('/api/pdf',pdfDetailsRoute);

// app.use((err,req,res,next)=>{
//     const statusCode=err.statusCode||500;
//     const message=err.message||'Internal Server Error';
//     res.status(statusCode).json({
//         success:false,
//         statusCode,
//         message,
//     });
// });
// app.listen(3000,()=>{
//     console.log("App is listening on port 3000");
// })


import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
// Import our new CCTNS-specific AI functions
import { generateAISummary, getPerformanceForecast } from './ai/analysis.js';

// --- 1. DATA LOADING ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Get data for the latest month (e.g., month 9)
  const latestMonth = 9;
  
  // 1. Find Top Conviction Rate
  const topConviction = convictionsDb
    .filter(d => d.month === latestMonth)
    .sort((a, b) => b.ipc_bns_conviction_rate - a.ipc_bns_conviction_rate)[0];

  // 2. Find Top NBW Execution
  const topNBW = nbwDb
    .filter(d => d.month === latestMonth)
    .sort((a, b) => b.executed_total - a.executed_total)[0];

  // 3. Find Top Narcotics (Ganja) Seizure
  const topNarcotics = preventiveDb
    .filter(d => d.month === latestMonth)
    .sort((a, b) => b.narcotics_seizure_ganja_kg - a.narcotics_seizure_ganja_kg)[0];
    
  const topDistricts = {
    conviction: { district: topConviction.district, value: topConviction.ipc_bns_conviction_rate.toFixed(1) },
    nbw: { district: topNBW.district, value: topNBW.executed_total },
    narcotics: { district: topNarcotics.district, value: topNarcotics.narcotics_seizure_ganja_kg.toFixed(0) }
  };

  // 4. Generate the AI summary
  const summary = generateAISummary(topDistricts);
  res.json({ summary });
});

/**
 * Feature: Performance Forecasting (ML "Districts to Watch")
 */
app.get('/api/ai/performance_forecast', authenticateToken, (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);
  
  // We use the pendency data for this forecast
  // We pass the full DB and the metric we want to forecast
  const alerts = getPerformanceForecast(pendencyDb, 'pendency_percentage');
  res.json(alerts);
});

/**
 * Feature: "Special Drive" Leaderboards
 * This is a dynamic endpoint for all drives.
 */
app.get('/api/drives/leaderboard/:metric', authenticateToken, (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);
  
  const { metric } = req.params;
  const latestMonth = 9; // Get latest month's data
  let db;
  let key = metric; // The key to sort by
  
  // Determine which DB to use
  if (metric.startsWith('firearms_')) {
    db = firearmsDb;
    // Special key for total firearms
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

  // Calculate the total for the metric
  const data = db.filter(d => d.month === latestMonth)
    .map(d => {
      let value = 0;
      if (metric === 'firearms_seized') {
        value = (d.seizure_gun_rifle + d.seizure_pistol + d.seizure_revolver + d.seizure_mouzer + d.seizure_ak_47 + d.seizure_slr + d.seizure_others);
      } else {
        value = d[key] || 0;
      }
      return { district: d.district, value };
    })
    .sort((a, b) => b.value - a.value); // Sort descending

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

  // 1. Initialize all districts with Conviction data
  convictionsDb.filter(d => d.month === latestMonth).forEach(d => {
    metricsMap[d.district] = {
      conviction_rate: d.ipc_bns_conviction_rate,
      nbw_executed: 0,
      narcotics_ganja_kg: 0,
      firearms_seized: 0
    };
  });

  // 2. Add NBW data
  nbwDb.filter(d => d.month === latestMonth).forEach(d => {
    if (metricsMap[d.district]) {
      metricsMap[d.district].nbw_executed = d.executed_total;
    }
  });
  
  // 3. Add Narcotics data
  preventiveDb.filter(d => d.month === latestMonth).forEach(d => {
    if (metricsMap[d.district]) {
      metricsMap[d.district].narcotics_ganja_kg = d.narcotics_seizure_ganja_kg;
    }
  });

  // 4. Add Firearms data
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
  
  // Security check: SP can only access their own district
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
  // We only allow SPs to submit data
  if (req.user.role !== 'SP') return res.sendStatus(403);
  
  const reportData = req.body;
  
  // In a real app, we would save this to the database.
  // For the hackathon, we just log it and send a success response.
  console.log(`[Server] Received CCTNS report submission from SP ${req.user.username} for district ${req.user.district}`);
  console.log(reportData);
  
  // Here you would write to the JSON files (or a DB)
  // fs.writeFileSync(...)
  
  res.json({ status: "success", message: "Report submitted successfully." });
});


// --- 6. START THE SERVER ---
app.listen(PORT, async () => {
  console.log(`[Server] Backend server is running on http://localhost:${PORT}`);
  console.log("\n[Server] All 8 CCTNS-compliant data files loaded.");
  console.log("[Server] Ready for connections.");
});