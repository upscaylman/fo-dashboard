import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Les variables d\'environnement Supabase ne sont pas configurées. ' +
        'Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définis dans .env'
    );
}

console.log('🔧 Configuration Supabase:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });

// Custom storage pour éviter les problèmes avec OneDrive
const customStorage = {
    getItem: (key: string) => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Ignore storage errors
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore storage errors
        }
    },
};

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // On gère manuellement dans AuthContext
        storage: customStorage,
        storageKey: 'fo-metaux-auth',
    },
});

// Helper function pour vérifier la connexion
export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Connexion Supabase OK');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion Supabase:', error);
        return false;
    }
};
