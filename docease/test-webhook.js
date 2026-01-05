// Test du webhook DocEase depuis le navigateur
// Ouvre la console (F12) et colle ce code

fetch('https://geljwonckfmdkaywaxly.supabase.co/functions/v1/docease-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'fo-metaux-docease-2025'
  },
  body: JSON.stringify({
    user_email: 'contact@fo-metaux.fr',
    document_type: 'Test Localhost',
    title: 'Test depuis la console navigateur',
    metadata: {
      test: true,
      source: 'localhost'
    }
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Webhook SUCCESS:', data);
  alert('✅ Webhook fonctionne ! Vérifie le dashboard.');
})
.catch(err => {
  console.error('❌ Webhook ERROR:', err);
  alert('❌ Erreur: ' + err.message);
});
