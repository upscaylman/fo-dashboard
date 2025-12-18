# ====================================================================
# SCRIPT DE DIAGNOSTIC REALTIME ET NOTIFICATIONS - FO MÉTAUX
# ====================================================================

Write-Host "`n=== DIAGNOSTIC FO MÉTAUX DASHBOARD ===" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://geljwonckfmdkaywaxly.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ"

# Test 1: Connexion Supabase
Write-Host "1️⃣ Test de connexion à Supabase..." -ForegroundColor Yellow
try {
    $test = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Method Head -Headers @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $anonKey"
    } -TimeoutSec 5
    Write-Host "   ✅ Connexion réussie" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Création d'un document de test
Write-Host "2️⃣ Création d'un document de test..." -ForegroundColor Yellow

$testDoc = @{
    user_email = "test@exemple.com"
    document_type = "test_diagnostic"
    title = "Test_Diagnostic_$(Get-Date -Format 'yyyyMMdd_HHmmss').docx"
    metadata = @{
        format = "docx"
        test = $true
    }
} | ConvertTo-Json

try {
    $doc = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/docease_documents" -Method Post -Headers @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $anonKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    } -Body $testDoc
    
    Write-Host "   ✅ Document créé (ID: $($doc.id))" -ForegroundColor Green
    Write-Host "   📄 Titre: $($doc.title)" -ForegroundColor Cyan
    
    # Attendre 2 secondes pour les triggers
    Write-Host "   ⏳ Attente de l'exécution des triggers (2s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   ℹ️  Vérifiez les permissions RLS sur la table docease_documents" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Vérification des notifications
Write-Host "3️⃣ Vérification des notifications créées..." -ForegroundColor Yellow

try {
    $notifs = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/notifications?select=*&order=created_at.desc&limit=10" -Method Get -Headers @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $anonKey"
    }
    
    $recentNotif = $notifs | Where-Object { $_.type -eq 'document_created' } | Select-Object -First 1
    
    if ($recentNotif) {
        Write-Host "   ✅ Notifications fonctionnelles !" -ForegroundColor Green
        Write-Host "   📬 Dernière notification:" -ForegroundColor Cyan
        Write-Host "      - Titre: $($recentNotif.title)" -ForegroundColor White
        Write-Host "      - Message: $($recentNotif.message)" -ForegroundColor White
        Write-Host "      - Créée: $($recentNotif.created_at)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Aucune notification 'document_created' trouvée" -ForegroundColor Red
        Write-Host "   ⚠️  Les triggers ne sont probablement PAS activés" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   ⚠️  La table 'notifications' n'existe probablement pas" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Via webhook Edge Function (plus réaliste)
Write-Host "4️⃣ Test via webhook DocEase (scénario réel)..." -ForegroundColor Yellow

try {
    $webhookDoc = @{
        user_email = "test@exemple.com"
        document_type = "test_webhook"
        title = "Test_Webhook_$(Get-Date -Format 'HHmmss').docx"
        metadata = @{
            format = "docx"
            source = "diagnostic_script"
        }
    } | ConvertTo-Json
    
    $webhookResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/docease-webhook" -Method Post -Headers @{
        "Authorization" = "Bearer $anonKey"
        "x-api-key" = "fo-metaux-docease-2025"
        "Content-Type" = "application/json"
    } -Body $webhookDoc
    
    Write-Host "   ✅ Webhook exécuté avec succès" -ForegroundColor Green
    Write-Host "   📊 Maintenant, vérifiez votre dashboard (http://localhost:4081)" -ForegroundColor Cyan
    Write-Host "      - Les stats devraient s'être mises à jour automatiquement" -ForegroundColor White
    Write-Host "      - Une notification devrait apparaître dans la cloche 🔔" -ForegroundColor White
    
} catch {
    Write-Host "   ⚠️  Webhook non disponible ou erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   ℹ️  Ceci est normal si l'Edge Function n'est pas déployée" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== RÉSULTAT DU DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 ACTIONS À EFFECTUER SI PROBLÈMES DÉTECTÉS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "➡️  SI LES NOTIFICATIONS NE SONT PAS CRÉÉES:" -ForegroundColor White
Write-Host "   1. Ouvrez Supabase Dashboard: https://supabase.com/dashboard/project/geljwonckfmdkaywaxly" -ForegroundColor Cyan
Write-Host "   2. Allez dans 'SQL Editor'" -ForegroundColor Cyan
Write-Host "   3. Créez un nouveau fichier et collez le contenu de:" -ForegroundColor Cyan
Write-Host "      ➜ MIGRATION_NOTIFICATIONS.sql" -ForegroundColor Yellow
Write-Host "   4. Exécutez le script SQL complet" -ForegroundColor Cyan
Write-Host ""
Write-Host "➡️  POUR VÉRIFIER REALTIME:" -ForegroundColor White
Write-Host "   1. Dans Supabase Dashboard → Database → Replication" -ForegroundColor Cyan
Write-Host "   2. Vérifiez que ces tables sont dans 'supabase_realtime':" -ForegroundColor Cyan
Write-Host "      ✓ docease_documents" -ForegroundColor Green
Write-Host "      ✓ notifications" -ForegroundColor Green
Write-Host "      ✓ signatures" -ForegroundColor Green
Write-Host "   3. Si manquantes, exécutez:" -ForegroundColor Cyan
Write-Host "      ALTER PUBLICATION supabase_realtime ADD TABLE docease_documents;" -ForegroundColor Yellow
Write-Host "      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;" -ForegroundColor Yellow
Write-Host ""
Write-Host "➡️  POUR TESTER APRÈS CORRECTIONS:" -ForegroundColor White
Write-Host "   1. Lancez le dashboard: npm run dev" -ForegroundColor Cyan
Write-Host "   2. Lancez DocEase et générez un document" -ForegroundColor Cyan
Write-Host "   3. Le dashboard devrait se mettre à jour en 2-3 secondes" -ForegroundColor Cyan
Write-Host "   4. Une notification 🔔 devrait apparaître dans le header" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== FIN DU DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host ""
