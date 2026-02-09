/**
 * Contexte d'authentification DocEase
 * Gère la connexion des utilisateurs avec validation @fo-metaux.fr
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Configuration Supabase
const SUPABASE_CONFIG = {
  url: 'https://geljwonckfmdkaywaxly.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ'
};

// Helper pour les requêtes DB avec fallback Edge Function
const dbRequest = async (
  table: string,
  method: 'GET' | 'POST' | 'DELETE',
  options?: {
    select?: string;
    eq?: Record<string, string>;
    body?: Record<string, unknown>;
  }
): Promise<{ data: unknown; error: Error | null }> => {
  const { select, eq, body } = options || {};
  
  // D'abord essayer l'Edge Function (plus fiable quand PostgREST a des problèmes)
  try {
    const edgeBody: Record<string, unknown> = { table };
    
    if (method === 'GET') {
      if (select) edgeBody.select = select;
      if (eq) edgeBody.eq = eq;
    } else if (method === 'POST' && body) {
      edgeBody.data = body;
      edgeBody.upsert = true;
    } else if (method === 'DELETE' && eq) {
      edgeBody.delete = true;
      edgeBody.eq = eq;
    }
    
    const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/db-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      },
      body: JSON.stringify(edgeBody)
    });
    
    if (response.ok) {
      const result = await response.json();
      return { data: result.data, error: null };
    }
  } catch (e) {
    console.warn('Edge Function failed, trying PostgREST:', e);
  }
  
  // Fallback vers PostgREST direct
  try {
    let url = `${SUPABASE_CONFIG.url}/rest/v1/${table}`;
    const headers: Record<string, string> = {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
    };
    
    if (method === 'GET') {
      const params = new URLSearchParams();
      if (select) params.append('select', select);
      if (eq) {
        Object.entries(eq).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
      }
      if (params.toString()) url += `?${params.toString()}`;
    } else if (method === 'DELETE' && eq) {
      const params = new URLSearchParams();
      Object.entries(eq).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });
      url += `?${params.toString()}`;
    } else if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
      headers['Prefer'] = 'resolution=merge-duplicates';
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body: method === 'POST' && body ? JSON.stringify(body) : undefined
    });
    
    if (response.ok) {
      const data = method === 'DELETE' ? null : await response.json();
      return { data, error: null };
    }
    
    return { data: null, error: new Error(`HTTP ${response.status}`) };
  } catch (e) {
    return { data: null, error: e as Error };
  }
};

// Domaines autorisés
const ALLOWED_DOMAINS = ['fo-metaux.fr'];

export interface DoceaseUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar_url?: string;
  logged_in_at: string;
}

interface AuthContextType {
  user: DoceaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, name?: string) => Promise<boolean>;
  logout: () => void;
  validateEmail: (email: string) => { valid: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé de stockage local
const STORAGE_KEY = 'docease_user';
const SESSION_KEY = 'docease_session_id';

export const DoceaseAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DoceaseUser | null>(null);
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
        error: `Domaine email non autorisé` 
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
          const parsedUser = JSON.parse(storedUser) as DoceaseUser;
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
  const updatePresenceOnLoad = async (loadedUser: DoceaseUser) => {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY) || crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionId);

      await dbRequest('active_sessions', 'POST', {
        body: {
          id: sessionId,
          user_id: loadedUser.id,
          user_email: loadedUser.email,
          user_name: loadedUser.name,
          current_page: 'docease',
          current_tool: 'docease',
          last_activity: new Date().toISOString()
        }
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
        // Chercher l'utilisateur dans la base via Edge Function
        const { data: users, error } = await dbRequest('users', 'GET', {
          select: 'id,name,email,role',
          eq: { email: trimmedEmail }
        });

        if (!error && Array.isArray(users) && users.length > 0) {
          const dbUser = users[0] as { id: string; name?: string; role?: string };
          userId = dbUser.id;
          userName = dbUser.name || userName;
          userRole = dbUser.role || 'user';
        }
      } catch (e) {
        console.warn('Impossible de vérifier l\'utilisateur dans la base:', e);
      }

      const newUser: DoceaseUser = {
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
        await dbRequest('active_sessions', 'POST', {
          body: {
            id: sessionId,
            user_id: newUser.id,
            user_email: newUser.email,
            user_name: newUser.name,
            current_page: 'docease',
            current_tool: 'docease',
            last_activity: new Date().toISOString(),
            started_at: new Date().toISOString()
          }
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
      dbRequest('active_sessions', 'DELETE', {
        eq: { id: sessionId }
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

export const useDoceaseAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useDoceaseAuth must be used within a DoceaseAuthProvider');
  }
  return context;
};
