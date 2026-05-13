import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

type Language = 'uk' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    refreshLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'uk',
    setLanguage: () => {},
    refreshLanguage: async () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState<Language>('uk');

    const fetchUserLanguage = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                const decoded: any = jwtDecode(token);
                const userId = decoded.id || decoded.userId || decoded.sub;

                if (userId) {
                    const response = await apiClient.get(`/users/${userId}`);
                    if (response.data.language) {
                        setLanguage(response.data.language);
                    }
                }
            }
        } catch (e) {
            console.log("Language fetch error, staying with default");
        }
    };

    useEffect(() => {
        fetchUserLanguage();
    }, []);

    const changeLanguage = async (newLang: Language) => {
        setLanguage(newLang);
        try {
            const token = await SecureStore.getItemAsync('userToken');

            const response = await apiClient.patch('/users/me/language',
                { language: newLang },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log('[LangDiag] Сервер підтвердив оновлення:', response.data);
        } catch (e: any) {
            console.error("[LangDiag] Помилка при зміні мови:", e.response?.data || e.message);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, refreshLanguage: fetchUserLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);