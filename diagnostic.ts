/**
 * Script de diagnostic pour déboguer les problèmes de connexion
 * À exécuter dans la console du navigateur
 */

async function diagnosticSupabase() {
    console.log('🔍 === DIAGNOSTIC SUPABASE ===');
    
    // 1. Vérifier le localStorage
    console.log('\n1️⃣ Vérification du localStorage:');
    const supabaseKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
    console.log('Clés Supabase trouvées:', supabaseKeys.length);
    supabaseKeys.forEach(key => {
        try {
            const value = localStorage.getItem(key);
            const parsed = JSON.parse(value || '{}');
            console.log(`  - ${key}:`, {
                hasAccessToken: !!parsed.access_token,
                hasRefreshToken: !!parsed.refresh_token,
                expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : 'N/A'
            });
        } catch (e) {
            console.log(`  - ${key}: Erreur de parsing`);
        }
    });

    // 2. Vérifier les variables d'environnement
    console.log('\n2️⃣ Variables d\'environnement:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Défini' : '❌ Manquant');
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Défini' : '❌ Manquant');

    // 3. Test de connexion
    console.log('\n3️⃣ Test de connexion à Supabase:');
    const { supabase } = await import('./lib/supabase.ts');
    
    try {
        const start = Date.now();
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        const duration = Date.now() - start;
        
        if (error) {
            console.error('❌ Erreur:', error.message);
        } else {
            console.log(`✅ Connexion réussie (${duration}ms)`);
        }
    } catch (e) {
        console.error('❌ Exception:', e.message);
    }

    // 4. Test getSession
    console.log('\n4️⃣ Test getSession:');
    try {
        const start = Date.now();
        const { data, error } = await supabase.auth.getSession();
        const duration = Date.now() - start;
        
        console.log(`Durée: ${duration}ms`);
        
        if (error) {
            console.error('❌ Erreur:', error.message);
        } else if (data.session) {
            console.log('✅ Session active:', {
                email: data.session.user.email,
                expiresAt: new Date(data.session.expires_at! * 1000).toLocaleString()
            });
        } else {
            console.log('ℹ️ Aucune session active (normal si non connecté)');
        }
    } catch (e) {
        console.error('❌ Exception:', e.message);
    }

    // 5. Vérifier le réseau
    console.log('\n5️⃣ Test réseau vers Supabase:');
    try {
        const response = await fetch('https://geljwonckfmdkaywaxly.supabase.co/rest/v1/', {
            method: 'HEAD',
            headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            }
        });
        console.log('✅ Supabase accessible, status:', response.status);
    } catch (e) {
        console.error('❌ Impossible de joindre Supabase:', e.message);
    }

    console.log('\n✅ === FIN DU DIAGNOSTIC ===');
}

// Export pour utilisation dans la console
declare global {
    interface Window {
        diagnosticSupabase: typeof diagnosticSupabase;
    }
}

window.diagnosticSupabase = diagnosticSupabase;

console.log('💡 Pour lancer le diagnostic, tapez: diagnosticSupabase()');
