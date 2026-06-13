const TOKEN_KEY = 'velluto_admin_token';
const USER_KEY = 'velluto_admin_user';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
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
};
