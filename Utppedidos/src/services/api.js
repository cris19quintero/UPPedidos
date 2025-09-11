    // src/services/api.js
    import axios from 'axios';

    const api = axios.create({
    baseURL:'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
    });

    api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
        console.error('No autorizado, redirigiendo al login...');
        window.location.href = '/login';
        }
        return Promise.reject(error);
    }
    );

    export default api;