# Script de diagnostic complet du workflow n8n
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC WORKFLOW N8N" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# 1. Vérifier que n8n est accessible
Write-Host "1. Verification de n8n..." -ForegroundColor Yellow
try {
    $n8nResponse = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   OK n8n est accessible" -ForegroundColor Green
}
catch {
    Write-Host "   ERREUR n8n n'est pas accessible" -ForegroundColor Red
    $issues += "n8n n'est pas accessible sur le port 5678"
}

# 2. Vérifier les conteneurs Docker
Write-Host ""
Write-Host "2. Verification des conteneurs Docker..." -ForegroundColor Yellow
try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    
    if ($containers -contains "n8n-local") {
        Write-Host "   OK n8n-local est en cours d'execution" -ForegroundColor Green
    }
    else {
        Write-Host "   ERREUR n8n-local n'est pas en cours d'execution" -ForegroundColor Red
        $issues += "Conteneur n8n-local non démarré"
    }
    
    if ($containers -contains "ollama") {
        Write-Host "   OK ollama est en cours d'execution" -ForegroundColor Green
    }
    else {
        Write-Host "   AVERTISSEMENT ollama n'est pas en cours d'execution" -ForegroundColor Yellow
        $warnings += "Conteneur ollama non démarré (nécessaire si useIA=true)"
    }
}
catch {
    Write-Host "   ERREUR Docker n'est pas accessible" -ForegroundColor Red
    $issues += "Docker n'est pas accessible ou n'est pas démarré"
}

# 3. Vérifier le template Word
Write-Host ""
Write-Host "3. Verification du template Word..." -ForegroundColor Yellow
try {
    $templateCheck = docker exec n8n-local test -f /templates/word/template_principal.docx 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK template_principal.docx existe" -ForegroundColor Green
    }
    else {
        Write-Host "   ERREUR template_principal.docx n'existe pas" -ForegroundColor Red
        $issues += "Template Word non trouvé dans /templates/word/"
    }
}
catch {
    Write-Host "   ERREUR Impossible de verifier le template" -ForegroundColor Red
    $warnings += "Impossible de vérifier le template Word"
}

# 4. Vérifier Ollama
Write-Host ""
Write-Host "4. Verification d'Ollama..." -ForegroundColor Yellow
try {
    $ollamaCheck = docker exec ollama curl -s http://localhost:11434/api/tags 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK Ollama est accessible" -ForegroundColor Green
        
        # Vérifier le modèle gemma2:2b
        if ($ollamaCheck -match "gemma2:2b") {
            Write-Host "   OK Modele gemma2:2b est installe" -ForegroundColor Green
        }
        else {
            Write-Host "   AVERTISSEMENT Modele gemma2:2b non trouve" -ForegroundColor Yellow
            $warnings += "Modèle gemma2:2b non installé (nécessaire si useIA=true)"
        }
    }
    else {
        Write-Host "   AVERTISSEMENT Ollama n'est pas accessible" -ForegroundColor Yellow
        $warnings += "Ollama non accessible (nécessaire si useIA=true)"
    }
}
catch {
    Write-Host "   AVERTISSEMENT Impossible de verifier Ollama" -ForegroundColor Yellow
    $warnings += "Impossible de vérifier Ollama"
}

# 5. Tester le webhook
Write-Host ""
Write-Host "5. Test du webhook..." -ForegroundColor Yellow
try {
    $testData = @{
        civiliteDestinataire = "Monsieur"
        nomDestinataire = "Test Diagnostic"
        statutDestinataire = "Test"
        adresse = "123 Rue Test"
        cpVille = "75001 Paris"
        objet = "Test Diagnostic"
        useIA = $false
        texte_ia = ""
        emailDestinataire = "test@example.com"
        emailDelegue = "delegue@example.com"
    } | ConvertTo-Json

    $webhookResponse = Invoke-WebRequest -Uri "http://localhost:5678/webhook/formulaire-doc" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop

    Write-Host "   Status: $($webhookResponse.StatusCode)" -ForegroundColor Cyan
    Write-Host "   Taille reponse: $($webhookResponse.Content.Length) octets" -ForegroundColor Cyan
    
    if ($webhookResponse.Content.Length -eq 0) {
        Write-Host "   ERREUR Reponse vide du webhook" -ForegroundColor Red
        $issues += "Le webhook retourne une réponse vide (Status 200 mais body vide)"
    }
    elseif ($webhookResponse.Content.Length -lt 100) {
        Write-Host "   AVERTISSEMENT Reponse tres courte" -ForegroundColor Yellow
        $warnings += "La réponse du webhook est très courte ($($webhookResponse.Content.Length) octets)"
    }
    else {
        Write-Host "   OK Reponse recue avec contenu" -ForegroundColor Green
    }
}
catch {
    Write-Host "   ERREUR Webhook a echoue: $_" -ForegroundColor Red
    $issues += "Le webhook a retourné une erreur: $_"
}

# 6. Vérifier les logs n8n
Write-Host ""
Write-Host "6. Verification des logs n8n (30 dernieres lignes)..." -ForegroundColor Yellow
try {
    $logs = docker logs n8n-local --tail 30 2>&1
    
    if ($logs -match "error|Error|ERROR") {
        Write-Host "   AVERTISSEMENT Erreurs trouvees dans les logs" -ForegroundColor Yellow
        $warnings += "Des erreurs ont été trouvées dans les logs n8n"
        
        Write-Host ""
        Write-Host "   Extraits des erreurs:" -ForegroundColor Yellow
        $logs | Select-String -Pattern "error|Error|ERROR" | Select-Object -First 5 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "   OK Pas d'erreurs evidentes dans les logs" -ForegroundColor Green
    }
}
catch {
    Write-Host "   AVERTISSEMENT Impossible de lire les logs" -ForegroundColor Yellow
}

# 7. Vérifier les nodes communautaires
Write-Host ""
Write-Host "7. Verification des nodes communautaires..." -ForegroundColor Yellow
Write-Host "   INFO Verifiez manuellement dans n8n:" -ForegroundColor Cyan
Write-Host "   - Settings > Community Nodes" -ForegroundColor Cyan
Write-Host "   - Verifiez que 'n8n-nodes-docxtemplater' est installe" -ForegroundColor Cyan

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUME DU DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "OK Aucun probleme detecte !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Le probleme de reponse vide peut etre du a:" -ForegroundColor Yellow
    Write-Host "1. Un noeud qui echoue silencieusement dans le workflow" -ForegroundColor Yellow
    Write-Host "2. Le noeud 'Convertir en HTML (Preview)' qui ne retourne pas de donnees" -ForegroundColor Yellow
    Write-Host "3. Le noeud 'Remplir Template Docx' qui echoue" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
    Write-Host "1. Ouvrez n8n: http://localhost:5678" -ForegroundColor White
    Write-Host "2. Ouvrez le workflow 'gpt_generator'" -ForegroundColor White
    Write-Host "3. Cliquez sur 'Execute Workflow' pour tester" -ForegroundColor White
    Write-Host "4. Observez quel noeud echoue ou ne retourne pas de donnees" -ForegroundColor White
}
else {
    if ($issues.Count -gt 0) {
        Write-Host "ERREURS CRITIQUES ($($issues.Count)):" -ForegroundColor Red
        $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "AVERTISSEMENTS ($($warnings.Count)):" -ForegroundColor Yellow
        $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        Write-Host ""
    }
    
    Write-Host "ACTIONS RECOMMANDEES:" -ForegroundColor Cyan
    
    if ($issues -match "n8n n'est pas accessible") {
        Write-Host "1. Demarrez n8n avec: .\start.bat" -ForegroundColor White
    }
    
    if ($issues -match "Conteneur.*non demarré") {
        Write-Host "2. Demarrez les conteneurs avec: docker-compose up -d" -ForegroundColor White
    }
    
    if ($issues -match "Template Word") {
        Write-Host "3. Verifiez que le template existe: templates\word\template_principal.docx" -ForegroundColor White
    }
    
    if ($warnings -match "Ollama") {
        Write-Host "4. Si vous utilisez l'IA, demarrez Ollama et installez le modele:" -ForegroundColor White
        Write-Host "   docker exec ollama ollama pull gemma2:2b" -ForegroundColor Gray
    }
    
    if ($issues -match "reponse vide") {
        Write-Host "5. Ouvrez n8n et testez le workflow manuellement:" -ForegroundColor White
        Write-Host "   http://localhost:5678" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Pour plus de details, consultez: WORKFLOW_ANALYSIS.md" -ForegroundColor Cyan
Write-Host ""

