import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        try {
            if (authService.isAuthenticated()) {
                const loggedInUser = authService.getCurrentUser();
                if (loggedInUser) {
                    setUser({
                        ...loggedInUser,
                        balance: Number(loggedInUser.balance)
                    });
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            authService.logout();
        } finally {
            setInitializing(false);
        }
    }, []);

    const login = async (username, password) => {
        if (loading) return;
        
        setLoading(true);
        try {
            const userData = await authService.login(username, password);
            const userWithParsedBalance = {
                ...userData,
                balance: Number(userData.balance)
            };
            setUser(userWithParsedBalance);
            return userWithParsedBalance;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    if (initializing) {
        return null; // hoặc loading spinner nếu cần
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};