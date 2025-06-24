// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Configure axios defaults
    useEffect(() => {
        // Update the API base URL to match your backend
        axios.defaults.baseURL = 'http://localhost:5095'; // Change to your API URL

        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Check if user is logged in on app start
    useEffect(() => {
        const initializeAuth = async () => {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (savedToken && savedUser) {
                try {
                    // Verify token is still valid by making a test request
                    axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                } catch (error) {
                    // Token is invalid, clear it
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        try {
            console.log('🔐 Attempting login with:', { username });
            console.log('🌐 API Base URL:', axios.defaults.baseURL);

            const response = await axios.post('/api/auth/login', {
                username,
                password
            });

            console.log('✅ Login response:', response.data);

            const { token: newToken, username: userName, role } = response.data;

            // Save to localStorage
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify({ username: userName, role }));

            // Update state
            setToken(newToken);
            setUser({ username: userName, role });

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return { success: true };
        } catch (error) {
            console.error('❌ Login error:', error);
            console.error('📄 Error response:', error.response?.data);
            console.error('🔢 Error status:', error.response?.status);

            return {
                success: false,
                error: error.response?.data || error.message || 'Login failed'
            };
        }
    };

    const register = async (username, email, password) => {
        try {
            console.log('📝 Attempting registration with:', { username, email });

            const response = await axios.post('/api/auth/register', {
                username,
                email,
                password
            });

            console.log('✅ Registration response:', response.data);

            const { token: newToken, username: userName, role } = response.data;

            // Save to localStorage
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify({ username: userName, role }));

            // Update state
            setToken(newToken);
            setUser({ username: userName, role });

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return { success: true };
        } catch (error) {
            console.error('❌ Registration error:', error);
            console.error('📄 Error response:', error.response?.data);
            console.error('🔢 Error status:', error.response?.status);

            return {
                success: false,
                error: error.response?.data || error.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const hasRole = (requiredRole) => {
        return user?.role === requiredRole;
    };

    const isAuthenticated = () => {
        return !!token && !!user;
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        hasRole,
        isAuthenticated,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook - exported as a separate component
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}