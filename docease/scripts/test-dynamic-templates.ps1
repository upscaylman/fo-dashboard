# Script pour tester le système de templates dynamiques
# Usage: .\scripts\test-dynamic-templates.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🧪 Test du Système de Templates Dynamiques            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$ConfigPath = Join-Path $RootDir "templates\config\variables.json"
$WordDir = Join-Path $RootDir "templates\word"
$WorkflowPath = Join-Path $RootDir "workflows\dev\gpt_generator.json"

$errors = @()
$warnings = @()
$success = @()

# ============================================================================
# Test 1 : Vérifier que variables.json existe et est valide
# ============================================================================
Write-Host "📋 Test 1: Configuration variables.json" -ForegroundColor Cyan

if (-not (Test-Path $ConfigPath)) {
    $errors += "❌ Fichier variables.json non trouvé: $ConfigPath"
}
else {
    try {
        $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        $success += "✅ variables.json existe et est valide"
        
        # Vérifier la structure
        if (-not $config.variables_communes) {
            $errors += "❌ Section 'variables_communes' manquante"
        }
        else {
            $success += "✅ Section 'variables_communes' présente"
        }
        
        if (-not $config.templates) {
            $errors += "❌ Section 'templates' manquante"
        }
        else {
            $templateCount = ($config.templates | Get-Member -MemberType NoteProperty).Count
            $success += "✅ Section 'templates' présente ($templateCount templates)"
        }
    }
    catch {
        $errors += "❌ Erreur de parsing JSON: $_"
    }
}

Write-Host ""

# ============================================================================
# Test 2 : Vérifier que tous les fichiers Word existent
# ============================================================================
Write-Host "📄 Test 2: Fichiers Word" -ForegroundColor Cyan

if ($config -and $config.templates) {
    foreach ($templateKey in ($config.templates | Get-Member -MemberType NoteProperty).Name) {
        $template = $config.templates.$templateKey
        $templateFile = $template.fichier
        $templatePath = Join-Path $WordDir $templateFile
        
        if (Test-Path $templatePath) {
            $success += "✅ $templateFile existe"
        }
        else {
            $errors += "❌ $templateFile manquant (requis par template '$templateKey')"
        }
    }
}

Write-Host ""

# ============================================================================
# Test 3 : Vérifier le workflow n8n
# ============================================================================
Write-Host "🔄 Test 3: Workflow n8n" -ForegroundColor Cyan

if (-not (Test-Path $WorkflowPath)) {
    $errors += "❌ Workflow non trouvé: $WorkflowPath"
}
else {
    try {
        $workflow = Get-Content $WorkflowPath -Raw | ConvertFrom-Json
        $success += "✅ Workflow existe et est valide"
        
        # Vérifier que le node "Lire Template Word" est de type function
        $readTemplateNode = $workflow.nodes | Where-Object { $_.name -eq "Lire Template Word" }
        
        if (-not $readTemplateNode) {
            $errors += "❌ Node 'Lire Template Word' non trouvé"
        }
        elseif ($readTemplateNode.type -ne "n8n-nodes-base.function") {
            $warnings += "⚠️  Node 'Lire Template Word' n'est pas de type 'function'"
            $warnings += "   Type actuel: $($readTemplateNode.type)"
            $warnings += "   → Le workflow n'est peut-être pas encore migré"
        }
        else {
            $success += "✅ Node 'Lire Template Word' est de type 'function' (dynamique)"
            
            # Vérifier que le code contient la logique dynamique
            if ($readTemplateNode.parameters.functionCode -match "variables\.json") {
                $success += "✅ Node charge dynamiquement variables.json"
            }
            else {
                $warnings += "⚠️  Node ne semble pas charger variables.json"
            }
        }
    }
    catch {
        $errors += "❌ Erreur de parsing du workflow: $_"
    }
}

Write-Host ""

# ============================================================================
# Test 4 : Vérifier que n8n est accessible
# ============================================================================
Write-Host "🌐 Test 4: Connectivité n8n" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -TimeoutSec 5 -UseBasicParsing
    $success += "✅ n8n est accessible sur http://localhost:5678"
}
catch {
    $warnings += "⚠️  n8n n'est pas accessible (peut-être pas démarré)"
    $warnings += "   Démarrez avec: .\start.ps1"
}

Write-Host ""

# ============================================================================
# Test 5 : Vérifier le serveur de formulaire
# ============================================================================
Write-Host "📝 Test 5: Serveur de formulaire" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    $success += "✅ Serveur de formulaire accessible sur http://localhost:3000"
}
catch {
    $warnings += "⚠️  Serveur de formulaire n'est pas accessible"
    $warnings += "   Démarrez avec: .\start.ps1"
}

Write-Host ""

# ============================================================================
# Test 6 : Vérifier la cohérence des variables
# ============================================================================
Write-Host "🔧 Test 6: Cohérence des variables" -ForegroundColor Cyan

if ($config -and $config.templates) {
    foreach ($templateKey in ($config.templates | Get-Member -MemberType NoteProperty).Name) {
        $template = $config.templates.$templateKey
        
        # Vérifier que chaque template a un nom
        if (-not $template.nom) {
            $errors += "❌ Template '$templateKey' n'a pas de nom"
        }
        
        # Vérifier que chaque template a un fichier
        if (-not $template.fichier) {
            $errors += "❌ Template '$templateKey' n'a pas de fichier"
        }
        
        # Vérifier que chaque variable spécifique a un label et un type
        if ($template.variables_specifiques) {
            foreach ($varKey in ($template.variables_specifiques | Get-Member -MemberType NoteProperty).Name) {
                $variable = $template.variables_specifiques.$varKey
                
                if (-not $variable.label) {
                    $warnings += "⚠️  Variable '$varKey' du template '$templateKey' n'a pas de label"
                }
                
                if (-not $variable.type) {
                    $warnings += "⚠️  Variable '$varKey' du template '$templateKey' n'a pas de type"
                }
            }
        }
    }
    
    if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
        $success += "✅ Toutes les variables sont cohérentes"
    }
}

Write-Host ""

# ============================================================================
# Test 7 : Vérifier les scripts utilitaires
# ============================================================================
Write-Host "🛠️  Test 7: Scripts utilitaires" -ForegroundColor Cyan

$requiredScripts = @(
    "add-new-template.ps1",
    "backup-workflow-html.ps1",
    "restore-workflow-html.ps1"
)

foreach ($script in $requiredScripts) {
    $scriptPath = Join-Path $ScriptDir $script
    if (Test-Path $scriptPath) {
        $success += "✅ Script $script présent"
    }
    else {
        $warnings += "⚠️  Script $script manquant"
    }
}

Write-Host ""

# ============================================================================
# Résumé
# ============================================================================
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor White
Write-Host "║                    📊 RÉSUMÉ DES TESTS                     ║" -ForegroundColor White
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor White
Write-Host ""

Write-Host "✅ Succès: $($success.Count)" -ForegroundColor Green
foreach ($msg in $success) {
    Write-Host "   $msg" -ForegroundColor Green
}
Write-Host ""

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  Avertissements: $($warnings.Count)" -ForegroundColor Yellow
    foreach ($msg in $warnings) {
        Write-Host "   $msg" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "❌ Erreurs: $($errors.Count)" -ForegroundColor Red
    foreach ($msg in $errors) {
        Write-Host "   $msg" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║     ❌ TESTS ÉCHOUÉS - Action requise                      ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ✅ TOUS LES TESTS RÉUSSIS                              ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    if ($warnings.Count -eq 0) {
        Write-Host "🎉 Le système est prêt à l'emploi!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Le système fonctionne mais il y a des avertissements" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "💡 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Ouvre le formulaire: http://localhost:3000" -ForegroundColor Gray
    Write-Host "   2. Teste chaque template" -ForegroundColor Gray
    Write-Host "   3. Vérifie que le document final a 1 seule page" -ForegroundColor Gray
    Write-Host ""
}

