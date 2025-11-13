// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  // optional: timeout: 10000
});

// // Optional: Add token header if you use auth
// api.interceptors.request.use((req) => {
//   const token = localStorage.getItem('token');
//   if (token) req.headers.Authorization = `Bearer ${token}`;
//   return req;
// }, (error) => Promise.reject(error));

export const getEvents = async () => {
  const resp = await api.get('/events');
  return resp.data;
};

export const analyzeSentiment = async (text) => {
  const resp = await api.post('/analyze_sentiment', { text });
  return resp.data;
};

export const analyzeTranscript = async (text) => {
  const resp = await api.post('/analyze_transcript', { text });
  return resp.data;
};

export default api;
