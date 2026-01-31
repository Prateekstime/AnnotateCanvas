import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Validate token or just load user data if endpoint exists
            // For now just assume logged in if token exists
            // Ideally we should have a /me endpoint
            setUser({ token });
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        localStorage.setItem('token', res.data.token);
        setUser({ token: res.data.token });
    };

    const register = async (username, password) => {
        const res = await api.post('/auth/register', { username, password });
        localStorage.setItem('token', res.data.token);
        setUser({ token: res.data.token });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
