import axios from 'axios';

// Set the base URL for our backend
const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL
});



/**
 * NEW: Axios Interceptor
 *
 * This is the magic. It "intercepts" every request going out.
 * It checks if we have a token in localStorage, and if so,
 * it automatically adds the "Authorization: Bearer TOKEN" header.
 *
 * This means we *never* have to manually add the token to any
 * of our other API calls (getPrideScore, getWorkloadData, etc.)
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



// === NEW AUTH ENDPOINT ===

/**
 * Logs the user in by sending username/password to the backend.
 * @param {string} username
 * @param {string} password
 * @returns {object} { token, user }
 */
export const login = async (username, password) => {
  const { data } = await api.post('/api/auth/login', { username, password });
  // If login is successful, store the token
  if (data.token) {
    localStorage.setItem('authToken', data.token);
  }
  return data;
};


/**
 * Logs the user out by simply removing the token.
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  // No API call needed, we just delete the token from the client
};


// === DGP (STATE-LEVEL) ENDPOINTS ===

/**
 * (DGP) AI: P.R.I.D.E. Score Leaderboard
 */
export const getPrideScore = async () => {
  const { data } = await api.get('/api/ai/pride_score');
  return data;
};

/**
 * (DGP) AI: Correlation (P.R.I.D.E. vs. Crime)
 */
export const getCorrelationData = async () => {
  const { data } = await api.get('/api/ai/correlation');
  return data;
};

/**
 * (DGP) AI: Live Public Sentiment Trend
 */
export const getSentimentTrends = async () => {
  const { data } = await api.get('/api/ai/sentiment_trends');
  return data;
};

/**
 * (DGP) AI: "Smart Alerts" (Crime Anomalies)
 */
export const getSmartAlerts = async () => {
  const { data } = await api.get('/api/ai/smart_alerts');
  return data;
};

/**
 * (DGP) Analytics: Workload & Resource
 */
export const getWorkloadData = async () => {
  const { data } = await api.get('/api/analytics/workload');
  return data;
};

/**
 * (DGP) Analytics: Granular HR
 */
export const getHrData = async () => {
  const { data } = await api.get('/api/analytics/hr');
  return data;
};

export const getTopOfficers = async () => {
  const { data } = await api.get(`/api/ai/top_officers`);
  return data;
};

// === SP (DISTRICT-LEVEL) ENDPOINTS ===

/**
 * (SP) AI: "Case Blocker" Analysis
 */
export const getCaseBlockers = async (district) => {
  const { data } = await api.get(`/api/ai/case_blockers/${district}`);
  return data;
};

/**
 * (SP) CCTNS: Case Management KPIs
 */
export const getCctnsKpis = async (district) => {
  const { data } = await api.get(`/api/cctns/kpis/${district}`);
  return data;
};

/**
 * (SP) P.R.I.D.E.: Positive Impact Map
 */
export const getPrideMapEvents = async (district) => {
  const { data } = await api.get(`/api/pride/map/${district}`);
  return data;
};

/**
 * (SP) P.R.I.D.E.: Recognition Portal (Feed)
 */
export const getPrideEvents = async (district) => {
  const { data } = await api.get(`/api/pride/events/${district}`);
  return data;
};



/**
 * (SP) P.R.I.D.E.: Recognition Portal (Action)
 */
export const approvePrideEvent = async (eventId) => {
  const { data } = await api.post(`/api/pride/approve/${eventId}`);
  return data;
};