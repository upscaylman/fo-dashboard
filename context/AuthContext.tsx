import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  realUser: User | null; // L'utilisateur réel (super admin) lors de l'impersonation
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  login: (provider: 'email' | 'outlook', data?: any) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  impersonate: (targetUser: User) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [realUser, setRealUser] = useState<User | null>(null); // Super admin réel
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Fonction pour "voir en tant que" un utilisateur
  const impersonate = (targetUser: User) => {
    if (!user || user.role !== 'super_admin') return;
    setRealUser(user); // Sauvegarder le super admin
    setUser(targetUser); // Afficher comme l'utilisateur cible
    setIsImpersonating(true);
  };

  // Fonction pour revenir à l'utilisateur réel
  const stopImpersonation = () => {
    if (realUser) {
      setUser(realUser);
      setRealUser(null);
      setIsImpersonating(false);
    }
  };

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role_level, avatar')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        const newProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilisateur',
          role_level: 'secretary',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`,
        };

        await supabase.from('users').insert(newProfile);

        return {
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role_level,
          avatar: newProfile.avatar,
        };
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role_level || 'secretary',
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
      };
    } catch (error) {
      console.error('Erreur profil:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const profile = await fetchUserProfile(authUser);
      if (profile) {
        setUser(profile);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Marquer la session comme active (persistera tant que l'onglet est ouvert)
    sessionStorage.setItem('fo-metaux-session-active', 'true');

    const handleAuth = async () => {
      console.log('🚀 AuthContext: Initialisation');
      
      // Vérifier si on a un callback OAuth dans le hash
      const hash = window.location.hash;
      
      if (hash.includes('access_token')) {
        console.log('🎯 Callback OAuth détecté dans le hash!');
        
        // Extraire les paramètres du hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('🔑 Tokens extraits, décodage JWT...');
          
          try {
            // Décoder le JWT pour obtenir les infos utilisateur
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            console.log('📧 Email du JWT:', payload.email);
            
            // Créer un profil minimal immédiatement
            const minimalUser: User = {
              id: payload.sub,
              email: payload.email,
              name: payload.user_metadata?.name || payload.email?.split('@')[0] || 'Utilisateur',
              role: 'secretary',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.email}`,
            };
            
            // Authentifier immédiatement avec le profil minimal
            if (mounted) {
              setUser(minimalUser);
              setIsAuthenticated(true);
              setIsLoading(false);
              // Nettoyer l'URL
              window.history.replaceState({}, document.title, '/');
              console.log('✅ Authentification réussie (profil minimal)!');
            }
            
            // Essayer de configurer la session Supabase en arrière-plan (avec timeout)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('TIMEOUT')), 10000)
            );
            
            try {
              await Promise.race([
                supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
                timeoutPromise
              ]);
              console.log('✅ Session Supabase configurée');
              
              // Charger le vrai profil depuis la DB
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser && mounted) {
                const profile = await fetchUserProfile(authUser);
                if (profile && mounted) {
                  setUser(profile);
                  console.log('✅ Profil complet chargé');
                }
              }
            } catch (e) {
              console.warn('⚠️ setSession timeout, requêtes DB peuvent échouer');
            }
            
            return;
          } catch (error) {
            console.error('❌ Erreur décodage JWT:', error);
          }
        }
      }
      
      // Pas de callback OAuth, vérifier session existante avec timeout
      console.log('🔍 Vérification session existante...');
      
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 3000)
      );
      
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        if (result && 'data' in result && result.data.session?.user && mounted) {
          console.log('✅ Session existante:', result.data.session.user.email);
          const profile = await fetchUserProfile(result.data.session.user);
          if (profile && mounted) {
            setUser(profile);
            setIsAuthenticated(true);
          }
        } else {
          console.log('❌ Aucune session (ou timeout)');
        }
      } catch (error) {
        console.error('❌ Erreur getSession:', error);
      }
      
      if (mounted) setIsLoading(false);
    };

    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('📢 Event Supabase:', event);

      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        console.log('🚪 Déconnexion');
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (provider: 'email' | 'outlook', data?: any) => {
    if (provider === 'email' && data?.email && data?.password) {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw new Error(error.message);
    } else if (provider === 'outlook') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email',
          redirectTo: window.location.origin,
        },
      });

      if (error) throw new Error('Erreur Outlook');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });

    if (error) throw new Error(error.message);
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, realUser, isAuthenticated, isLoading, isImpersonating, login, register, logout, refreshUser, impersonate, stopImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
};