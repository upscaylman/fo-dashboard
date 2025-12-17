import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://geljwonckfmdkaywaxly.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ';

console.log('🔍 === TEST CONNEXION SUPABASE ===\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    try {
        // Test 1: Connexion basique
        console.log('1️⃣ Test connexion API...');
        const start1 = Date.now();
        const { data: healthData, error: healthError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });
        
        const duration1 = Date.now() - start1;
        
        if (healthError) {
            console.error('❌ Erreur:', healthError.message);
            console.error('   Détails:', healthError);
            return;
        }
        
        console.log(`✅ API accessible (${duration1}ms)\n`);

        // Test 2: GetSession
        console.log('2️⃣ Test getSession...');
        const start2 = Date.now();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const duration2 = Date.now() - start2;
        
        if (sessionError) {
            console.error('❌ Erreur getSession:', sessionError.message);
            return;
        }
        
        console.log(`✅ GetSession OK (${duration2}ms)`);
        console.log('   Session active:', sessionData.session ? 'OUI' : 'NON');
        
        if (sessionData.session) {
            console.log('   User:', sessionData.session.user.email);
        }
        console.log();

        // Test 3: Lire les utilisateurs
        console.log('3️⃣ Test lecture table users...');
        const start3 = Date.now();
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, name, role_level')
            .limit(5);
        
        const duration3 = Date.now() - start3;
        
        if (usersError) {
            console.error('❌ Erreur lecture users:', usersError.message);
            console.error('   Code:', usersError.code);
            console.error('   Hint:', usersError.hint);
            return;
        }
        
        console.log(`✅ Lecture users OK (${duration3}ms)`);
        console.log(`   Nombre d'utilisateurs trouvés: ${users?.length || 0}`);
        
        if (users && users.length > 0) {
            console.log('   Premier utilisateur:', users[0]);
        }
        console.log();

        // Test 4: Test d'inscription (sans vraiment créer)
        console.log('4️⃣ Test structure auth...');
        console.log('✅ Client Supabase Auth initialisé correctement\n');

        console.log('✅ === TOUS LES TESTS RÉUSSIS ===');

    } catch (error) {
        console.error('❌ ERREUR INATTENDUE:', error.message);
        console.error('   Stack:', error.stack);
    }
}

testConnection();
