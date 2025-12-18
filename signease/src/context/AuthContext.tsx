/**
 * Contexte d'authentification SignEase
 * Gère la connexion des utilisateurs avec validation @fo-metaux.fr
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Configuration Supabase
const SUPABASE_CONFIG = {
  url: 'https://geljwonckfmdkaywaxly.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ'
};

// Domaines autorisés
const ALLOWED_DOMAINS = ['fo-metaux.fr'];

export interface SigneaseUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar_url?: string;
  logged_in_at: string;
}

interface AuthContextType {
  user: SigneaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, name?: string) => Promise<boolean>;
  logout: () => void;
  validateEmail: (email: string) => { valid: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé de stockage local
const STORAGE_KEY = 'signease_user';
const SESSION_KEY = 'signease_session_id';

export const SigneaseAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SigneaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Valider l'email
  const validateEmail = useCallback((email: string): { valid: boolean; error?: string } => {
    if (!email || email.trim() === '') {
      return { valid: false, error: 'L\'email est requis' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Vérifier le format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { valid: false, error: 'Format d\'email invalide' };
    }

    // Vérifier le domaine
    const domain = trimmedEmail.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return { 
        valid: false, 
        error: `Seules les adresses @fo-metaux.fr sont autorisées` 
      };
    }

    return { valid: true };
  }, []);

  // Charger l'utilisateur depuis le stockage local
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as SigneaseUser;
          // Vérifier que l'email est toujours valide
          const validation = validateEmail(parsedUser.email);
          if (validation.valid) {
            setUser(parsedUser);
            // Mettre à jour la présence au chargement
            updatePresenceOnLoad(parsedUser);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Erreur chargement utilisateur:', e);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [validateEmail]);

  // Mettre à jour la présence au chargement
  const updatePresenceOnLoad = async (loadedUser: SigneaseUser) => {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY) || crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionId);

      await fetch(`${SUPABASE_CONFIG.url}/rest/v1/active_sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: sessionId,
          user_id: loadedUser.id,
          user_email: loadedUser.email,
          user_name: loadedUser.name,
          current_page: 'signease',
          current_tool: 'signease',
          last_activity: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Erreur mise à jour présence:', e);
    }
  };

  // Connexion
  const login = useCallback(async (email: string, name?: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const validation = validateEmail(email);
      if (!validation.valid) {
        setError(validation.error || 'Email invalide');
        setIsLoading(false);
        return false;
      }

      const trimmedEmail = email.trim().toLowerCase();
      
      // Essayer de récupérer l'utilisateur depuis Supabase
      let userName = name || trimmedEmail.split('@')[0];
      let userId = crypto.randomUUID();
      let userRole = 'user';

      try {
        // Chercher l'utilisateur dans la base
        const response = await fetch(
          `${SUPABASE_CONFIG.url}/rest/v1/users?email=eq.${encodeURIComponent(trimmedEmail)}&select=id,name,email,role`,
          {
            headers: {
              'apikey': SUPABASE_CONFIG.anonKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
          }
        );

        if (response.ok) {
          const users = await response.json();
          if (users && users.length > 0) {
            const dbUser = users[0];
            userId = dbUser.id;
            userName = dbUser.name || userName;
            userRole = dbUser.role || 'user';
          }
        }
      } catch (e) {
        console.warn('Impossible de vérifier l\'utilisateur dans la base:', e);
      }

      const newUser: SigneaseUser = {
        id: userId,
        email: trimmedEmail,
        name: userName,
        role: userRole,
        logged_in_at: new Date().toISOString()
      };

      // Sauvegarder localement
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);

      // Créer une session de présence
      const sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionId);

      try {
        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/active_sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: sessionId,
            user_id: newUser.id,
            user_email: newUser.email,
            user_name: newUser.name,
            current_page: 'signease',
            current_tool: 'signease',
            last_activity: new Date().toISOString(),
            started_at: new Date().toISOString()
          })
        });
      } catch (e) {
        console.warn('Impossible de créer la session:', e);
      }

      setIsLoading(false);
      return true;
    } catch (e) {
      console.error('Erreur de connexion:', e);
      setError('Une erreur est survenue lors de la connexion');
      setIsLoading(false);
      return false;
    }
  }, [validateEmail]);

  // Déconnexion
  const logout = useCallback(() => {
    // Supprimer la session de présence
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/active_sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      }).catch(console.error);
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setError(null);
  }, []);

  // Nettoyer la session à la fermeture
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (sessionId) {
        // Utiliser sendBeacon pour garantir l'envoi
        navigator.sendBeacon(
          `${SUPABASE_CONFIG.url}/rest/v1/active_sessions?id=eq.${sessionId}`,
          JSON.stringify({ _method: 'DELETE' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        validateEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useSigneaseAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSigneaseAuth must be used within a SigneaseAuthProvider');
  }
  return context;
};
