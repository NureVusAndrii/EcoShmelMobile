import apiClient from './client';
import { AuthResponse, PushToken } from './types';

export const authService = {
    async register(data: { email: string; name: string; password: string; pushToken?: PushToken }) {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    async login(data: { email: string; password: string }) {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    }
};

export const userService = {
    async updateLocation(coords: [number, number]) {
        return await apiClient.patch('/users/me', {
            location: {
                type: 'Point',
                coordinates: coords // [lon, lat]
            }
        });
    }
};