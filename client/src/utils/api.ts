import type { User } from '@/types/User';
import type { Squad } from '@/types/Squad';
import type { SquadMembership } from '@/types/SquadMembership';
import axios from 'axios';
import { use } from 'react';

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});
// #region Payment APIs
export const getPayments = async (userId: string) => {
    try {
        const response = await api.get(`/payment/get-payments/${userId}`);
        const payments = response.data.map((payment: any) => ({
            ...payment,
            dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
        }));
        return payments;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch payments');
        }
        throw error;
    }
}
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

export const getTeam = async (teamId: string) => {
    try {
        const response = await api.get(`/team/get-team/${teamId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch team');
        }
        throw error;
    }
}

// #region Squad APIs
export const getSquads = async () => {
    try {
        const response = await api.get('/squad/get-squads');
        return response.data as Squad[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch squads');
        }
        throw error;
    }
}

export const getSquad = async (squadId: string) => {
    try {
        const response = await api.get(`/squad/get-squad/${squadId}`);
        return response.data as Squad;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch squad');
        }
        throw error;
    }
}

export const getSquadMembers = async (squadId: string) => {
    try {
        const response = await api.get(`/squad/get-squad-members/${squadId}`);
        return response.data as SquadMembership[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch squad members');
        }
        throw error;
    }
}

export const addSquadMembers = async (squadId: string, userIds: string[], roles: string[]) => {
    try {
        const response = await api.post(`/squad/add-squad-members/${squadId}`, {
            userIds,
            roles,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to add squad members');
        }
        throw error;
    }
}

export const updateSquadMemberRoles = async (membershipId: string, roles: string[]) => {
    try {
        const response = await api.put(`/squad/update-squad-member-roles/${membershipId}`, {
            roles,
        });
        return response.data as SquadMembership;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to update squad member roles');
        }
        throw error;
    }
}

export const deleteSquadMember = async (membershipId: string) => {
    try {
        const response = await api.delete(`/squad/delete-squad-member/${membershipId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to delete squad member');
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