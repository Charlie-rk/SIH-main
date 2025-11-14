import axios from 'axios';

// Set the base URL for our backend
const API_URL = 'http://localhost:8000';
const LATEST_MONTH =9;

const api = axios.create({
  baseURL: API_URL
});

/**
 * Axios Interceptor
 * This automatically attaches the auth token to every request.
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

// === AUTHENTICATION ===

/**
 * Logs the user in by sending username/password to the backend.
 * @param {string} username
 * @param {string} password
 * @returns {object} { token, user }
 */
export const login = async (username, password) => {
  const { data } = await api.post('/api/auth/login', { username, password });
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
 * Feature: AI-Generated "Monthly Performance Summary" (NLP/NLG)
 */
export const getMonthlySummary = async () => {
  const { data } = await api.get('/api/ai/monthly_summary');
  return data;
};

/**
 * Feature: Performance Forecasting (ML "Districts to Watch")
 */
export const getPerformanceForecast = async () => {
  const { data } = await api.get('/api/ai/performance_forecast');
  return data;
};

/**
 * Feature: "Special Drive" Leaderboards
 * @param {string} metric - 'firearms_seized', 'sand_mining_cases', 'narcotics_ganja_kg', 'nbw_executed'
 */
export const getDriveLeaderboard = async (metric) => {
  const { data } = await api.get(`/api/drives/leaderboard/${metric}`);
  return data;
};

/**
 * Feature: Conviction Rate Leaderboard
 */
export const getConvictionRates = async () => {
  const { data } = await api.get('/api/analytics/conviction_rates');
  return data;
};

/**
 * Feature: GIS / Geo-Analytics Map Data
 */
export const getMapData = async () => {
  const { data } = await api.get('/api/analytics/map_data');
  return data;
};

// === SP (DISTRICT-LEVEL) ENDPOINTS ===

/**
 * Feature: Get all data for a single district (for SP form pre-fill)
 * @param {string} district - The name of the district
 * @param {number} month - The month (e.g., 8 or 9)
 */
export const getDistrictData = async (district, month) => {
  const { data } = await api.get(`/api/district_data/${district}/${month}`);
  return data;
};

/**
 * Feature: Submit "Good Work Done" Report
 * @param {object} reportData - The complete form data from the SP
 */
export const postCctnsReport = async (reportData) => {
  const { data } = await api.post('/api/cctns/report', reportData);
  return data;
};



export const uploadCctnsFile = async (file, reportType) => {
  const formData = new FormData();
  formData.append('reportFile', file); // The backend expects 'reportFile'

  const { data } = await api.post(`/api/cctns/upload/${reportType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};


// NEW: Trends
export const getTrend = async (metric = 'narcotics_ganja_kg', months = 6, top = 5) => {
  const { data } = await api.get(`/api/trends/${metric}?months=${months}&top=${top}`);
  return data;
};

export const getTopDistricts = async (metric = 'narcotics_ganja_kg', months = 6, top = 5) => {
  const { data } = await api.get(`/api/trends/top/${metric}?months=${months}&top=${top}`);
  return data;
};


export const fetchGoodWorkReport = async () => {
  const { data } = await api.get('/api/reports/good-work-done');
  console.log(data);
  return data;
};