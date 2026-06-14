import { useState } from 'react';
import { loginUser, signupUser } from '../services/authService';
import { clearSession, getStoredToken, getStoredUser, storeSession } from '../utils/authStorage';
import AuthContext from './contextStore';

const USER_KEY = 'velluto_admin_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  const authenticate = (data) => {
    storeSession(data.access_token, data.user);
    setToken(data.access_token);
    setUser(data.user);
  };

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    authenticate(data);
    return data.user;
  };

  const signup = async (details) => {
    const data = await signupUser(details);
    authenticate(data);
    return data.user;
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const refreshUser = (updatedUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = { user, token, isAuthenticated: Boolean(token), login, signup, logout, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
