import axios from 'axios';
import Cookies from 'js-cookie';

// const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://mymeditalks.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = Cookies.get('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
