import { useState } from 'react';
import { loginUser, resendOtp, signupUser, verifyOtp } from '../services/authService';
import { clearSession, getStoredToken, getStoredUser, storeSession } from '../utils/authStorage';
import AuthContext from './contextStore';

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

  const signup = async (details) => signupUser(details);
  const confirmOtp = async (payload) => verifyOtp(payload);
  const requestOtpResend = async (payload) => resendOtp(payload);

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    login,
    signup,
    confirmOtp,
    requestOtpResend,
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
