import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(false);

    const _setAuth = (data) => {
        const userObj = { id: data._id, name: data.name, email: data.email };
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userObj));
        setToken(data.token);
        setUser(userObj);
    };

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const login = async (email, password) => {
        const { data } = await axios.post(`${apiUrl}/auth/login`, { email, password });
        _setAuth(data);
        return data;
    };

    const register = async (name, email, password) => {
        const { data } = await axios.post(`${apiUrl}/auth/register`, { name, email, password });
        _setAuth(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
