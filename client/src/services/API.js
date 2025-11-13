// import axios from "axios";
// // import dotenv from './../../.env'
// // dotenv.config();
// const API = axios.create({ baseURL: "http://localhost:8000" });
// API.interceptors.request.use((req) => {
//   if (localStorage.getItem("token")) {
//     req.headers.Authorization = `Bearer ${localStorage.getItem("token")} `;
//   }
//   return req;
// });

// export default API;

import axios from 'axios';

/**
 * The base URL of our Python backend.
 * We'll run our FastAPI server on port 8000.
 */
const API_URL = 'http://localhost:8000';

/**
 * We create a "pre-configured" instance of axios.
 * Any request made with this 'api' instance will
 * automatically have the baseURL set.
 */
const api = axios.create({
  baseURL: API_URL,
});

/**
 * --- STUB FUNCTION 1 ---
 * Fetches all 'events' from our backend.
 * This will replace the mockEvents in App.js.
 */
export const getEvents = async () => {
  // We'll uncomment this when the backend is ready.
  // const response = await api.get('/events');
  // return response.data;

  // For now, return an empty array to prevent errors.
  return []; 
};

/**
 * --- STUB FUNCTION 2 ---
 * Sends a block of text to the backend for sentiment analysis.
 * 'text' is a string we get from the AIAnalyzer component.
 */
export const analyzeSentiment = async (text) => {
  // We'll uncomment this when the backend is ready.
  // const response = await api.post('/analyze_sentiment', { text: text });
  // return response.data;

  // For now, return a mock response.
  return { label: 'POSITIVE', score: 0.99 };
};

/**
 * --- STUB FUNCTION 3 ---
 * Sends a block of text (transcript) to the backend for professionalism analysis.
 * 'text' is a string we get from the AIAnalyzer component.
 */
export const analyzeTranscript = async (text) => {
  // We'll uncomment this when the backend is ready.
  // const response = await api.post('/analyze_transcript', { text: text });
  // return response.data;

  // For now, return a mock response.
  return { tags: ['De-escalation', 'Citizen Gratitude'] };
};

// Export the api instance itself in case we need it elsewhere
export default api;