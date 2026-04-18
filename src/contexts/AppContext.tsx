import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface AppContextType {
  usuario: string;
  notificaciones: number;
  setNotificaciones: (count: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState(0);

  // Obtener usuario del contexto de autenticación
  const usuario = user?.nombre || 'Sistema';

  return (
    <AppContext.Provider value={{ usuario, notificaciones, setNotificaciones }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
