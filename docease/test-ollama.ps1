# Script de test Ollama
Write-Host "🔍 Test de connexion à Ollama..." -ForegroundColor Cyan

# Test 1 : Vérifier si Ollama répond
Write-Host "`n1️⃣ Test de connexion..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
    Write-Host "✅ Ollama est accessible" -ForegroundColor Green
    Write-Host "Modèles disponibles:" -ForegroundColor Cyan
    $response.models | ForEach-Object {
        Write-Host "  - $($_.name) (taille: $([math]::Round($_.size / 1MB, 2)) MB)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Ollama n'est pas accessible" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nVérifiez que Ollama est démarré avec: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Test 2 : Vérifier si gemma2:2b est installé
Write-Host "`n2️⃣ Vérification du modèle gemma2:2b..." -ForegroundColor Yellow
$hasGemma = $response.models | Where-Object { $_.name -eq "gemma2:2b" }
if ($hasGemma) {
    Write-Host "✅ Le modèle gemma2:2b est installé" -ForegroundColor Green
} else {
    Write-Host "❌ Le modèle gemma2:2b n'est pas installé" -ForegroundColor Red
    Write-Host "Installez-le avec: ollama pull gemma2:2b" -ForegroundColor Yellow
    exit 1
}

# Test 3 : Test de génération de texte
Write-Host "`n3️⃣ Test de génération de texte..." -ForegroundColor Yellow
Write-Host "Envoi d'un prompt de test..." -ForegroundColor Cyan

$body = @{
    model = "gemma2:2b"
    prompt = "Écris un court texte professionnel de 2 phrases pour une lettre administrative."
    stream = $false
    options = @{
        num_predict = 100
        temperature = 0.7
    }
} | ConvertTo-Json

try {
    Write-Host "⏳ Génération en cours (peut prendre 10-30 secondes)..." -ForegroundColor Yellow
    $startTime = Get-Date
    
    $result = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "✅ Génération réussie en $([math]::Round($duration, 2)) secondes" -ForegroundColor Green
    Write-Host "`nTexte généré:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $result.response -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    Write-Host "`n📊 Statistiques:" -ForegroundColor Cyan
    Write-Host "  - Tokens générés: $($result.eval_count)" -ForegroundColor White
    Write-Host "  - Temps total: $($result.total_duration / 1000000000) secondes" -ForegroundColor White
    Write-Host "  - Vitesse: $([math]::Round($result.eval_count / ($result.eval_duration / 1000000000), 2)) tokens/sec" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erreur lors de la génération" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Tous les tests sont passés avec succès !" -ForegroundColor Green
Write-Host "Ollama est prêt à être utilisé avec l'application." -ForegroundColor Cyan

