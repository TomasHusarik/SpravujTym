import axios from 'axios';

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

//#region User APIs
export const loginUser = async (email: string, password: string) => {
    try {
        const response = await api.post('/user/login', {
            email,
            password
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        const response = await api.post('/user/logout');
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Logout failed');
        }
        throw error;
    }
};

export const authUser = async () => {
    try {
        const response = await api.get('/user/auth-user');
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Authentication failed');
        }
        throw error;
    }
};