import axios from 'axios';

// Backend portunu kendi backend URL'in ile kontrol et (gerekirse portu değiştir)
const API = axios.create({
    baseURL: 'http://localhost:5047/api',
});

// Her istek öncesi LocalStorage'dan Token'ı alıp Header'a ekler
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 401 Unauthorized dönerse otomatik Login'e atar
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;