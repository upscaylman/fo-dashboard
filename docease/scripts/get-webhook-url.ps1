# Script pour aider à trouver l'URL exacte du webhook dans n8n
Write-Host "🔍 Guide pour trouver l'URL du webhook dans n8n" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Étapes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrez n8n dans votre navigateur:" -ForegroundColor Cyan
Write-Host "   http://localhost:5678" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Allez dans 'Workflows' (menu de gauche)" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Cliquez sur le workflow 'gpt_generator'" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Dans le workflow, cliquez sur le PREMIER nœud (celui de type 'Webhook')" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Dans les paramètres du nœud Webhook, regardez:" -ForegroundColor Cyan
Write-Host "   - Le 'Path' défini (ex: 'formulaire-doc')" -ForegroundColor Gray
Write-Host "   - Le mode (Test ou Production)" -ForegroundColor Gray
Write-Host ""
Write-Host "6. En bas du panneau, vous verrez l'URL complète du webhook" -ForegroundColor Cyan
Write-Host "   Elle devrait ressembler à:" -ForegroundColor Gray
Write-Host "   http://localhost:5678/webhook-test/[ID-UNIQUE]" -ForegroundColor Green
Write-Host "   ou" -ForegroundColor Gray
Write-Host "   http://localhost:5678/webhook-test/formulaire-doc" -ForegroundColor Green
Write-Host ""
Write-Host "7. COPPIEZ L'URL EXACTE et collez-la ci-dessous:" -ForegroundColor Yellow
Write-Host ""

$webhookUrl = Read-Host "Collez l'URL du webhook depuis n8n"

if ($webhookUrl) {
    Write-Host ""
    Write-Host "🧪 Test de l'URL fournie..." -ForegroundColor Cyan
    
    $testData = @{
        civilite = "Monsieur"
        nom = "Test"
        adresse = "123 Test"
        template = "securite"
        texte_ai = "test"
        destinataires = "test@example.com"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri $webhookUrl `
            -Method POST `
            -ContentType "application/json" `
            -Body $testData `
            -UseBasicParsing `
            -ErrorAction Stop
        
        Write-Host "✅ Webhook accessible !" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Cyan
        Write-Host "   URL fonctionnelle: $webhookUrl" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Mettez à jour templates/form/form.html avec cette URL:" -ForegroundColor Yellow
        Write-Host "   Remplacez 'http://localhost:3000/webhook-test/formulaire-doc'" -ForegroundColor Gray
        Write-Host "   Par l'URL correspondante via le proxy (port 3000)" -ForegroundColor Gray
    }
    catch {
        $statusCode = "?"
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
        }
        
        Write-Host "❌ Webhook non accessible (Status: $statusCode)" -ForegroundColor Red
        Write-Host "   Vérifiez que:" -ForegroundColor Yellow
        Write-Host "   - Le workflow est activé (toggle vert)" -ForegroundColor Gray
        Write-Host "   - L'URL est correcte" -ForegroundColor Gray
        Write-Host "   - Le webhook est en mode Public/Production" -ForegroundColor Gray
    }
}

Write-Host ""

