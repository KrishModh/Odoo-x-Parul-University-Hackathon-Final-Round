const TOKEN_KEY = 'kitchen_token';
const USER_KEY = 'kitchen_user';
const PENDING_VERIFICATION_KEY = 'velluto_kitchen_pending_verification';

const readStorage = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export const getStoredToken = () => readStorage(TOKEN_KEY);
export const getStoredUser = () => {
  try {
    const value = readStorage(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};
export const storeSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  clearPendingVerification();
};
export const storePendingVerification = (value) => sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(value));
export const getPendingVerification = () => {
  try {
    const value = sessionStorage.getItem(PENDING_VERIFICATION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};
export const clearPendingVerification = () => sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
