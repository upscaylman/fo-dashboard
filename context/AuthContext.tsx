import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: 'email' | 'outlook', data?: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utilisateur simulé pour la démo
const MOCK_USER: User = {
  name: 'Marie Dubois',
  email: 'marie.dubois@fo-metaux.fr',
  role: 'Secrétaire Générale',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Vérification de la session au démarrage
  useEffect(() => {
    const storedAuth = localStorage.getItem('fo_metaux_auth');
    if (storedAuth === 'true') {
      setUser(MOCK_USER);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (provider: 'email' | 'outlook', data?: any) => {
    setIsLoading(true);
    
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1500));

    localStorage.setItem('fo_metaux_auth', 'true');
    setUser(MOCK_USER);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('fo_metaux_auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};