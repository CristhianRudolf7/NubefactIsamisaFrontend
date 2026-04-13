import { createContext, useContext, useState, type ReactNode } from 'react';

interface AppContextType {
  usuario: string;
  setUsuario: (usuario: string) => void;
  notificaciones: number;
  setNotificaciones: (count: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState('usuario_demo');
  const [notificaciones, setNotificaciones] = useState(0);

  return (
    <AppContext.Provider value={{ usuario, setUsuario, notificaciones, setNotificaciones }}>
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
