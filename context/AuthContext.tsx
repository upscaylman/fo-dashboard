import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ROLE_LABELS } from '../lib/permissions';
import { 
  waitForServiceReady, 
  recordSuccess, 
  recordFailure, 
  isTransientError,
  queryViaEdgeFunction,
  insertViaEdgeFunction,
  enableEdgeFallback
} from '../lib/supabaseRetry';

// Fonction pour émettre un événement de notification
const emitRoleChangeNotification = (oldRole: string, newRole: string) => {
  const event = new CustomEvent('role-changed', { 
    detail: { oldRole, newRole, message: `Votre rôle a été modifié : ${ROLE_LABELS[newRole as keyof typeof ROLE_LABELS] || newRole}` }
  });
  window.dispatchEvent(event);
};

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
      // Utiliser directement Edge Function car PostgREST est en 503
      console.log('Auth: Fetching profile via Edge Function for', authUser.email);
      
      const edgeResult = await queryViaEdgeFunction<{id: string; name: string; email: string; role_level: string; avatar: string}[]>('users', {
        select: 'id,name,email,role_level,avatar',
        eq: { id: authUser.id },
        limit: 1
      });
      
      if (!edgeResult.error && edgeResult.data && edgeResult.data.length > 0) {
        const userData = edgeResult.data[0];
        console.log('Auth: Profile loaded:', userData.email, userData.role_level);
        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role_level || 'secretary',
          avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        };
      }
      
      // Si pas trouvé, créer le profil
      if (!edgeResult.error && edgeResult.data && edgeResult.data.length === 0) {
        console.log('Auth: User not found, creating profile...');
        const newProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilisateur',
          role_level: 'secretary',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`,
        };

        await insertViaEdgeFunction('users', newProfile);

        return {
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role_level,
          avatar: newProfile.avatar,
        };
      }
      
      // Fallback minimal si Edge Function échoue
      console.log('Auth: Edge Function failed, using minimal profile');
      return {
        id: authUser.id,
        name: authUser.email?.split('@')[0] || 'Utilisateur',
        email: authUser.email || '',
        role: 'secretary',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`,
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

  // Écouter les changements de rôle en temps réel
  useEffect(() => {
    if (!user?.id || isImpersonating) return;

    const currentRole = user.role;
    
    const channel = supabase
      .channel(`user-role-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Changement détecté sur le profil utilisateur:', payload);
          const newRole = payload.new.role_level;
          const newName = payload.new.name;
          const newAvatar = payload.new.avatar;
          
          // Mettre à jour le profil utilisateur si le rôle a changé
          if (newRole && newRole !== currentRole) {
            console.log(`📋 Rôle mis à jour: ${currentRole} → ${newRole}`);
            // Émettre un événement pour notifier le changement de rôle
            emitRoleChangeNotification(currentRole, newRole);
            setUser(prev => prev ? { ...prev, role: newRole, name: newName || prev.name, avatar: newAvatar || prev.avatar } : null);
          } else if (newName !== user.name || newAvatar !== user.avatar) {
            // Mise à jour d'autres champs (nom, avatar)
            setUser(prev => prev ? { ...prev, name: newName || prev.name, avatar: newAvatar || prev.avatar } : null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status (user role):', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isImpersonating]);

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