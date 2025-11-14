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
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// --- AI Module Import ---
import { analyzeSentiment, analyzeCaseDiary } from './ai/analysis.js';

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

// Load all 5 data files on server start
const prideDb = loadJsonFile('mock_data.json'); // 150 "Good Work" events
const cctnsDb = loadJsonFile('mock_cctnsdata.json'); // 200 CCTNS cases
const strengthDb = loadJsonFile('DistrictReport.json'); // 30 districts HR data
const feedbackDb = loadJsonFile('publicfeedback.json'); // 150 sentiment entries
const ipcDb = loadJsonFile('OdishaIPCCrimedata.json'); // Real IPC crime data
const usersDb = loadJsonFile('users.json'); 

const JWT_SECRET = "YOUR_HACKATHON_SECRET_KEY";
// Helper function to process the IPC data on start

let analyticsDb = [];
function loadAndProcessIPCData() {
  const headers = ipcDb.fields.map(field => field.label);
  analyticsDb = ipcDb.data.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      const cleanKey = header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_$/, '');
      const value = row[index];
      // Convert numeric strings to actual numbers
     if (cleanKey !== 'district' && !isNaN(value) && value.trim() !== '') {
        entry[cleanKey] = Number(value);
    } else {
        entry[cleanKey] = value;
        }
    });
    return entry;
  });
  console.log(`[Server] Real data loaded and processed: ${analyticsDb.length} records.`);
}
loadAndProcessIPCData();

// --- 2. APP INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 8000;

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// Root (Health Check)
app.get('/', (req, res) => res.json({ message: "Odisha Police Strategic Command API is running!" }));


// --- 4. AUTHENTICATION ---

/**
 * NEW: Login Endpoint
 * This is a PUBLIC endpoint.
 */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username,password);

  // 1. Find the user in our mock DB
  const user = usersDb.find(u => u.username === username);
  console.log(user);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // 2. Compare the hashed password
  // const isMatch = await bcrypt.compare(password, user.passwordHash);
  // if (!isMatch) {
  //   return res.status(401).json({ error: "Invalid username or password" });
  // }

  // 3. Create a JWT Token
  const userPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    district: user.district
  };

  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });

  // 4. Send the token and user info (without password)
  res.json({
    token,
    user: userPayload
  });
});


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (token == null) {
    return res.sendStatus(401); // No token, unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Token is no longer valid
    }
    req.user = user; // Add the user payload to the request object
    next(); // Proceed to the protected route
  });
};

// === DGP (STATE-LEVEL) DASHBOARD ENDPOINTS ===

/**
 * This new, single, reusable function calculates the "true" P.R.I.D.E. score
 * for all districts. Both our API endpoints will now use this.
 */
async function getPrideScoreLeaderboard() {
  const districtScores = {};

  // Initialize scores for all districts
  Object.keys(strengthDb).forEach(district => {
    districtScores[district] = { A: 0, B: 0, C_pos: 0, C_total: 0, score: 0 };
  });

  // A) Calculate Community Engagements (FIXED: Uses event.district)
  prideDb.events.forEach(event => {
    const district = event.district;
    if (districtScores[district] && event.type === 'community_engagement') {
      districtScores[district].A++;
    }
  });
  
  // B) Calculate "Beyond the Call" Nominations (FIXED: Uses event.district)
  prideDb.events.forEach(event => {
    const district = event.district;
    if (districtScores[district] && (event.type === 'btc_nomination' || event.type === 'citizen_commendation')) {
      districtScores[district].B++;
    }
  });

  // C) Calculate Positive Sentiment Ratio (Async)
  const sentimentPromises = feedbackDb.map(async (entry) => {
    const result = await analyzeSentiment(entry.text);
    return { district: entry.district, label: result.label };
  });
  const sentimentResults = await Promise.all(sentimentPromises);

  sentimentResults.forEach(result => {
    if (districtScores[result.district]) {
      districtScores[result.district].C_total++;
      if (result.label === 'POSITIVE') {
        districtScores[result.district].C_pos++;
      }
    }
  });

  // Final Score Calculation
  const finalLeaderboard = Object.keys(districtScores).map(district => {
    const { A, B, C_pos, C_total } = districtScores[district];
    const C_Ratio = (C_total === 0) ? 0 : (C_pos / C_total);
    const score = Math.round((A * 0.4) + (B * 3) + (C_Ratio * 100 * 0.3));
    return { district, score, A, B, C_Ratio: (C_Ratio * 100).toFixed(0) };
  });

  // Return the full, sorted data
  return finalLeaderboard.sort((a, b) => b.score - a.score);
}
/**
 * Feature 1.1: P.R.I.D.E. Score Leaderboard (AI Weighted Model)
 */
app.get('/api/ai/pride_score', authenticateToken, async (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);
  
  // 1. Call our new, single helper function
  const leaderboard = await getPrideScoreLeaderboard();
  
  // 2. Send the result
  console.log(leaderboard); // Your console log
  res.json(leaderboard);
});



/**
 * Feature 1.2: Correlation Analysis (AI Data Fusion with Year Output)
 */
app.get('/api/ai/correlation', authenticateToken, async (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);

  const YEARS = [2012, 2013, 2014];

  // 1. Get PRIDE leaderboard (latest normalized score)
  const prideData = await getPrideScoreLeaderboard();
  const prideScoreMap = new Map(prideData.map(d => [d.district, d.score]));

  // 2. Group IPC crime by district & year
  const crimesByYear = {}; 
  YEARS.forEach(y => crimesByYear[y] = {});

  analyticsDb
    .filter(d => 
      YEARS.includes(d.year) &&
      d.district !== "Total" &&
      d.district !== "G.R.P., Cuttack" &&
      d.district !== "G.R.P., Rourkela"
    )
    .forEach(row => {
      crimesByYear[row.year][row.district] = row.total_ipc_crimes;
    });

  // 3. Compute 3-year averages per district
  const ipc_avg_by_district = {};

  Object.keys(strengthDb).forEach(district => {
    let values = [];

    YEARS.forEach(y => {
      if (crimesByYear[y][district] !== undefined) {
        values.push(crimesByYear[y][district]);
      }
    });

    if (values.length > 0) {
      ipc_avg_by_district[district] = Math.round(
        values.reduce((a, b) => a + b, 0) / values.length
      );
    } else {
      ipc_avg_by_district[district] = 0;
    }
  });

  // 4. Build final year-wise response
  const finalData = [];

  YEARS.forEach(year => {
    Object.keys(crimesByYear[year]).forEach(district => {
      finalData.push({
        year: year,
        district: district,
        pride_score: prideScoreMap.get(district) || 0,
        average_total_crime: ipc_avg_by_district[district] || 0,
        yearly_crime: crimesByYear[year][district] || 0
      });
    });
  });

  // 5. Filter out zero/noise data
  const cleaned = finalData.filter(d =>
    d.pride_score > 0 &&
    d.average_total_crime > 0 &&
    d.yearly_crime > 0
  );

  console.log("CORRELATION DATA (YEAR + AVG) => \n", cleaned);

  res.json(cleaned);
});



/**
 * Feature 1.3: Live Public Sentiment Trend (NLP)
 */
app.get('/api/ai/sentiment_trends',authenticateToken, async (req, res) => {
  const trendsByDate = {};
  
  const promises = feedbackDb.map(item => analyzeSentiment(item.text));
  const results = await Promise.all(promises);
  
  results.forEach((result, index) => {
    const item = feedbackDb[index];
    const date = item.date;
    
    if (!trendsByDate[date]) {
      trendsByDate[date] = { positive: 0, negative: 0, neutral: 0 };
    }
    
    if (result.label === 'POSITIVE') {
      trendsByDate[date].positive++;
    } else if (result.label === 'NEGATIVE') {
      trendsByDate[date].negative++;
    }
  });

  // Format for charts
  const chartData = Object.keys(trendsByDate).map(date => ({
    date,
    ...trendsByDate[date]
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  res.json(chartData);
});

/**
 * Feature 1.4: AI-Powered "Smart Alert" System (ML)
 */
app.get('/api/ai/smart_alerts',authenticateToken, (req, res) => {
  const alerts = [];
  const districts = Object.keys(strengthDb);
  const crimeTypes = ['murder_section_302_ipc', 'rape_section_376_ipc', 'theft_section_379_382_ipc', 'robbery_section_392_394_397_398_ipc', 'dacoity_section_395_398_ipc', 'riots_section_147_148_149_151_ipc'];

  districts.forEach(district => {
    crimeTypes.forEach(crimeKey => {
      const d_2012 = analyticsDb.find(d => d.district === district && d.year === 2012);
      const d_2013 = analyticsDb.find(d => d.district === district && d.year === 2013);
      const d_2014 = analyticsDb.find(d => d.district === district && d.year === 2014);

      if (d_2012 && d_2013 && d_2014) {
        const val_2012 = d_2012[crimeKey];
        const val_2013 = d_2013[crimeKey];
        const val_2014 = d_2014[crimeKey];
        const avg = (val_2012 + val_2013) / 2;
        
        if (avg === 0 && val_2014 > 0) { // Handle division by zero
          alerts.push({ type: 'red', text: `🔴 ALERT: ${crimeKey.split('_')[0]} in ${district} has spiked from 0 to ${val_2014}.` });
        } else if (avg > 0) {
          const diff = (val_2014 - avg) / avg;
          if (diff > 0.20) { // 20% increase
            alerts.push({ type: 'red', text: `🔴 ALERT: ${crimeKey.split('_')[0]} in ${district} is ${Math.round(diff * 100)}% above the 2-year average.` });
          } else if (diff < -0.20) { // 20% decrease
            alerts.push({ type: 'green', text: `🟢 INFO: ${crimeKey.split('_')[0]} in ${district} has decreased by ${Math.abs(Math.round(diff * 100))}% since 2013.` });
          }
        }
      }
    });
  });
  res.json(alerts);
});


/**
 * Feature 1.5: "Workload & Resource Analysis" (Data Fusion)
 */
app.get('/api/analytics/workload',authenticateToken, (req, res) => {
  console.log("hitted \n");
  const ipc_2014 = analyticsDb.filter(d => d.year === 2014 && d.district !== 'Total' && d.district !== 'G.R.P.');
  
  const workloadData = ipc_2014.map(crimeData => {
    const district = crimeData.district;
    const strengthData = strengthDb[district];
    
    if (!strengthData) {
      return { district, totalCrime: crimeData.total_ipc_crimes, totalOfficers: 0, ratio: "N/A" };
    }
    
    const totalCrime = crimeData.total_ipc_crimes;
    const totalOfficers = strengthData.total_strength;
    const ratio = (totalCrime / totalOfficers).toFixed(2);
    
    return { district, totalCrime, totalOfficers, ratio: parseFloat(ratio) };
  }).sort((a, b) => b.ratio - a.ratio);
  
  res.json(workloadData);
});


/**
 * Feature 1.6: Granular HR Analytics
 */
app.get('/api/analytics/hr',authenticateToken, (req, res) => {
  // Simply return the raw, detailed strength data.
  // The frontend will aggregate it for state-wide pie charts.
  res.json(strengthDb);
});

// === SP (DISTRICT-LEVEL) DASHBOARD ENDPOINTS ===

/**
 * Feature 2.1: The "Recognition Portal" (Data Feed)
 */
app.get('/api/pride/events/:district',authenticateToken, (req, res) => {
  const { district } = req.params;
  const events = prideDb.events.filter(event => {
    // A simple text search for the district name in the summary
    return event.summary.toLowerCase().includes(district.toLowerCase()) && 
           (event.type === 'btc_nomination' || event.type === 'citizen_commendation');
  });
  res.json(events);
});


/**
 * Feature 2.1: The "Recognition Portal" (User Action)
 */
app.post('/api/pride/approve/:eventId',authenticateToken, (req, res) => {
  const { eventId } = req.params;
  // Simulate a database write
  console.log(`[Server] SP has approved commendation for event ID: ${eventId}. (Simulated)`);
  res.json({ status: "approved", eventId: eventId });
});



// **
//  * Feature 2.2: AI-Powered "Case Blocker" Analysis (NLP)
//  */
app.get('/api/ai/case_blockers/:district',authenticateToken, (req, res) => {
  const { district } = req.params;
  const pendingCases = cctnsDb.filter(c => 
    c.district.toLowerCase() === district.toLowerCase() && 
    c.status === 'Pending Investigation'
  );
  
  const blockers = {
    "Awaiting Forensics": 0,
    "Witness Unavailable": 0,
    "Awaiting ISP Response": 0,
    "CCTV Enhancement": 0,
    "Bank Compliance": 0,
    "Under Active Investigation": 0,
    "No Summary": 0
  };
  
  pendingCases.forEach(caseFile => {
    const result = analyzeCaseDiary(caseFile.case_diary_summary);
    blockers[result.tag]++;
  });

  // Format for charts
  const chartData = Object.keys(blockers).map(name => ({ name, value: blockers[name] }));
  res.json(chartData);
});


/**
 * Feature 2.3: Tactical Case Management KPIs
 */
app.get('/api/cctns/kpis/:district', authenticateToken,(req, res) => {
  const { district } = req.params;
  const districtCases = cctnsDb.filter(c => c.district.toLowerCase() === district.toLowerCase());
  
  const totalCases = districtCases.length;
  if (totalCases === 0) {
    return res.json({ clearanceRate: 0, topCrimes: [] });
  }

  const solvedCases = districtCases.filter(c => c.status === 'Case Closed - Solved').length;
  const clearanceRate = Math.round((solvedCases / totalCases) * 100);
  
  const crimeCounts = {};
  districtCases.forEach(c => {
    crimeCounts[c.crime_type] = (crimeCounts[c.crime_type] || 0) + 1;
  });
  
  const topCrimes = Object.keys(crimeCounts).map(name => ({
    name,
    count: crimeCounts[name]
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  // res.json({ clearanceRate, topCrimes });
  res.json({ clearanceRate, topCrimes, totalCases });
});


/**
 * Feature 2.4: Positive Impact Map
 */
app.get('/api/pride/map/:district',authenticateToken, (req, res) => {
    const { district } = req.params;
    const events = prideDb.events.filter(event => 
      event.summary.toLowerCase().includes(district.toLowerCase())
    );
    res.json(events);
});

/**
 * NEW: Top Performing Officers
 */
app.get('/api/ai/top_officers', authenticateToken, (req, res) => {
  if (req.user.role !== 'DGP') return res.sendStatus(403);

  const officerCounts = {};

  // 1. Scan all "good work" events
  prideDb.events.forEach(event => {
    if (event.type === 'btc_nomination' || event.type === 'citizen_commendation') {
      const officer = event.officer;
      officerCounts[officer] = (officerCounts[officer] || 0) + 1;
    }
  });

  // 2. Format and sort the data
  const topOfficers = Object.keys(officerCounts).map(officer => ({
    name: officer,
    recognitions: officerCounts[officer]
  }))
  .sort((a, b) => b.recognitions - a.recognitions) // Sort descending
  .slice(0, 10); // Get top 10

  res.json(topOfficers);
});

// --- 5. START THE SERVER ---
app.listen(PORT, async () => {
  console.log(`[Server] Backend server is running on http://localhost:${PORT}`);
  
  // Pre-warm AI model on start so the first API call isn't slow
  console.log("[Server] Pre-warming AI Sentiment model...");
  await analyzeSentiment("Pre-load test");
  console.log("[Server] AI Sentiment model is warm and ready.");
  
  console.log("\n[Server] All 5 data files loaded. All 10 API endpoints are live.");
  console.log("[Server] Ready for connections.");
});