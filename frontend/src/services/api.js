import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const message = err.response?.data?.error || err.message || 'Error de conexión';
    throw new Error(message);
  }
);

export const getMakes = (popular = false) =>
  api.get(`/makes${popular ? '?popular=true' : ''}`);

export const getModels = (makeId) =>
  api.get(`/models?make_id=${makeId}`);

export const getYears = (modelId) =>
  api.get(`/years?model_id=${modelId}`);

export const getTrims = (yearId) =>
  api.get(`/trims?year_id=${yearId}`);

export const getPriceEstimate = (params) =>
  api.get('/prices/estimate', { params });

export const getPriceHistory = (make, model, year) =>
  api.get('/prices/history', { params: { make, model, year } });

export const getListings = (params) =>
  api.get('/listings', { params });

export const refreshListings = (make, model, year) =>
  api.post('/listings/refresh', { make, model, year });

export const calculateFinancing = (data) =>
  api.post('/financing/calculate', data);

export const getFinancingRates = () =>
  api.get('/financing/rates');

export const formatMXN = (amount) => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (n) =>
  new Intl.NumberFormat('es-MX').format(n);

export default api;
