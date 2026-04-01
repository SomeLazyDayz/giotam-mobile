import axios from 'axios';

// Tự động nhận diện IP của máy tính khi chạy qua mạng LAN
const hostname = window.location.hostname;
const defaultApiUrl = (hostname === 'localhost' || hostname === '127.0.0.1') 
  ? 'http://localhost:5000' 
  : `http://${hostname}:5000`;

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