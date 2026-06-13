import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  useEffect(() => {
    document.title = 'Velluto Cashier';
  }, []);

  return <AppRoutes />;
}
