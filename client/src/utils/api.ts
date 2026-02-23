import type { User } from '@/types/User';
import axios from 'axios';

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// #region Venue APIs
export const getVenues = async () => {
    try {
        const response = await api.get('/venue/get-venues');
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch venues');
        }
        throw error;
    }
}
// #region Team Events APIs
export const getTeamEvent = async (eventId: string) => {
    try {
        const response = await api.get(`/team-event/get-team-event/${eventId}`);
        const event = response.data;
        return {
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch team event');
        }
        throw error;
    }
};

export const getParticipantTeamEvents = async () => {
    try {
        const response = await api.get('/team-event/get-participant-events');
        
        const teamEvents = response.data.map((event: any) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
        }));
        
        return teamEvents;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch participant team events');
        }
        throw error;
    }
};

export const updateParticipationStatus = async (eventId: string, newStatus: string) => {
    try {
        const response = await api.post('/team-event/update-participation-status', {
            eventId,
            status: newStatus
        });
        return response.data;
    } catch (error) {
        console.error('Error updating participation status:', error);
    }
}

// #region User APIs
export const getUser = async (userId: string) => {
    try {
        const response = await api.get(`/user/get-user/${userId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch user');
        }
        throw error;
    }
};

export const getUsers = async () => {
    try {
        const response = await api.get('/user/get-users');
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch users');
        }
        throw error;
    }
};

export const updateUser = async (userData: User) => {
    try {
        const response = await api.put(`/user/update-user/${userData._id}`, userData);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to update user');
        }
        throw error;
    }
}

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