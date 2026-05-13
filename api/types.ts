// src/api/types.ts
export interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    pushTokens: string[];
    location?: any; // GeoJSON
}

export interface Alert {
    id: string;
    type: string;
    message: string;
    geo: any;
    status: 'active' | 'resolved';
    triggeredAt: string;
}

export interface PushToken {
    token: string;
    platform: 'android' | 'ios' | 'web';
    deviceId?: string;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: {
        _id: string;
        email: string;
        name: string;
        roles: string[];
    };
}