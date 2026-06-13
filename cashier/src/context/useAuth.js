import { useContext } from 'react';
import AuthContext from './contextStore';

export const useAuth = () => useContext(AuthContext);
