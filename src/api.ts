import axios from 'axios';

// URL backend production (Render.com)
const PRODUCTION_URL = 'https://giotam-backend.onrender.com';

// Khi chạy qua Capacitor (APK), hostname là 'localhost' nhưng KHÔNG phải máy tính
// Nên phải dùng URL cố định thay vì tự động nhận diện
const hostname = window.location.hostname;
const isLocalDev = (hostname === 'localhost' || hostname === '127.0.0.1') 
  && !import.meta.env.VITE_API_URL;

const defaultApiUrl = isLocalDev ? 'http://localhost:5000' : PRODUCTION_URL;

export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s – Render free tier cần đến 50s để cold-start
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

// Tự động gắn Token nếu user đã đăng nhập
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});