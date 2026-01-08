# Script pour corriger les sections conditionnelles dans le template Word
# S'assure que les sauts de page sont DANS les sections conditionnelles

param(
    [string]$TemplatePath = "templates\word\template_principal.docx",
    [switch]$Backup = $true
)

Write-Host "=== CORRECTION DES SECTIONS CONDITIONNELLES ===" -ForegroundColor Green
Write-Host ""

# Vérifier que le fichier existe
if (-not (Test-Path $TemplatePath)) {
    Write-Host "❌ Erreur: Le fichier $TemplatePath n'existe pas" -ForegroundColor Red
    exit 1
}

# Créer une sauvegarde
if ($Backup) {
    $backupPath = $TemplatePath -replace '\.docx$', "_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').docx"
    Copy-Item $TemplatePath $backupPath
    Write-Host "✅ Sauvegarde créée: $backupPath" -ForegroundColor Green
}

# Créer un dossier temporaire
$tempDir = "$env:TEMP\docx_fix_$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # Extraire le .docx (c'est un ZIP)
    Write-Host "📦 Extraction du template..." -ForegroundColor Yellow
    $zipPath = "$tempDir\template.zip"
    Copy-Item $TemplatePath $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

    # Lire le document.xml
    $docXmlPath = "$tempDir\word\document.xml"
    $xml = Get-Content $docXmlPath -Raw -Encoding UTF8

    Write-Host "📄 Analyse du document XML..." -ForegroundColor Yellow

    # Analyser la structure actuelle
    Write-Host "`n=== STRUCTURE ACTUELLE ===" -ForegroundColor Cyan
    
    # Compter les balises
    $openDesig = ([regex]::Matches($xml, '\{#isDesignation\}')).Count
    $closeDesig = ([regex]::Matches($xml, '\{/isDesignation\}')).Count
    $openNego = ([regex]::Matches($xml, '\{#isMandatNego\}')).Count
    $closeNego = ([regex]::Matches($xml, '\{/isMandatNego\}')).Count
    $pageBreaks = ([regex]::Matches($xml, '<w:br w:type="page"')).Count

    Write-Host "Sections isDesignation: Ouvertures=$openDesig, Fermetures=$closeDesig" -ForegroundColor White
    Write-Host "Sections isMandatNego: Ouvertures=$openNego, Fermetures=$closeNego" -ForegroundColor White
    Write-Host "Sauts de page totaux: $pageBreaks" -ForegroundColor White

    # Vérifier que les sections sont bien fermées
    if ($openDesig -ne $closeDesig -or $openNego -ne $closeNego) {
        Write-Host "`n❌ ERREUR: Les sections conditionnelles ne sont pas correctement fermées!" -ForegroundColor Red
        Write-Host "Veuillez corriger manuellement le template Word." -ForegroundColor Yellow
        exit 1
    }

    if ($openDesig -eq 0 -and $openNego -eq 0) {
        Write-Host "`n⚠️  ATTENTION: Aucune section conditionnelle trouvée dans le template!" -ForegroundColor Yellow
        Write-Host "Le template doit contenir {#isDesignation}...{/isDesignation} et {#isMandatNego}...{/isMandatNego}" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "`n✅ Les sections sont correctement fermées" -ForegroundColor Green

    # Analyser la position des sauts de page par rapport aux sections
    Write-Host "`n=== ANALYSE DES SAUTS DE PAGE ===" -ForegroundColor Cyan

    # Trouver les positions des balises (approximatif car le XML est fragmenté)
    $hasIssues = $false

    # Vérifier si des sauts de page existent entre les sections
    # Pattern: chercher des sauts de page qui ne sont pas entourés de balises conditionnelles
    
    # Pour une analyse précise, on va chercher les patterns problématiques
    # Pattern problématique: {/condition} ... <w:br w:type="page" ... {#condition}
    
    $problematicPattern1 = '\{/isDesignation\}[^{]*<w:br w:type="page"[^{]*\{#isMandatNego\}'
    $problematicPattern2 = '\{/isMandatNego\}[^{]*<w:br w:type="page"'
    
    if ($xml -match $problematicPattern1) {
        Write-Host "⚠️  Saut de page trouvé ENTRE les sections (après isDesignation, avant isMandatNego)" -ForegroundColor Yellow
        $hasIssues = $true
    }
    
    if ($xml -match $problematicPattern2) {
        Write-Host "⚠️  Saut de page trouvé APRÈS la section isMandatNego" -ForegroundColor Yellow
        $hasIssues = $true
    }

    if (-not $hasIssues) {
        Write-Host "✅ Les sauts de page semblent correctement placés dans les sections" -ForegroundColor Green
        Write-Host "`n💡 Si tu reçois toujours toutes les pages, le problème vient d'ailleurs." -ForegroundColor Cyan
        Write-Host "   Vérifie que le nœud Docxtemplater dans n8n évalue bien les conditions." -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ PROBLÈME DÉTECTÉ: Les sauts de page sont mal placés" -ForegroundColor Red
        Write-Host "`n📝 CORRECTION MANUELLE NÉCESSAIRE:" -ForegroundColor Yellow
        Write-Host "1. Ouvre le template dans Word: $TemplatePath" -ForegroundColor White
        Write-Host "2. Assure-toi que la structure est:" -ForegroundColor White
        Write-Host ""
        Write-Host "   {#isDesignation}" -ForegroundColor Cyan
        Write-Host "   [Contenu de la désignation]" -ForegroundColor White
        Write-Host "   [SAUT DE PAGE] ← Doit être ICI, AVANT la fermeture" -ForegroundColor Green
        Write-Host "   {/isDesignation}" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   {#isMandatNego}" -ForegroundColor Cyan
        Write-Host "   [Contenu du mandat]" -ForegroundColor White
        Write-Host "   [SAUT DE PAGE] ← Doit être ICI, AVANT la fermeture" -ForegroundColor Green
        Write-Host "   {/isMandatNego}" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3. Sauvegarde le fichier" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Pour insérer un saut de page dans Word:" -ForegroundColor Cyan
        Write-Host "   - Place le curseur où tu veux le saut" -ForegroundColor White
        Write-Host "   - Appuie sur Ctrl+Entrée" -ForegroundColor White
        Write-Host "   - Ou: Insertion → Saut de page" -ForegroundColor White
    }

    # Afficher un extrait du XML pour debug (optionnel)
    Write-Host "`n=== EXTRAIT DU XML (pour debug) ===" -ForegroundColor Cyan
    
    # Extraire les parties avec les balises conditionnelles
    $pattern = '(\{[#/]is[^}]+\})'
    $matches = [regex]::Matches($xml, $pattern)
    
    if ($matches.Count -gt 0) {
        Write-Host "Balises trouvées dans l'ordre:" -ForegroundColor White
        foreach ($match in $matches) {
            # Extraire un contexte autour de la balise
            $index = $match.Index
            $start = [Math]::Max(0, $index - 100)
            $length = [Math]::Min(200, $xml.Length - $start)
            $context = $xml.Substring($start, $length)
            
            # Nettoyer pour affichage
            $context = $context -replace '<w:t>', '' -replace '</w:t>', '' -replace '<[^>]+>', ' ' -replace '\s+', ' '
            
            Write-Host "  $($match.Value)" -ForegroundColor Cyan
            if ($context -match '<w:br w:type="page"') {
                Write-Host "    → Saut de page détecté près de cette balise" -ForegroundColor Yellow
            }
        }
    }

    Write-Host "`n=== RECOMMANDATIONS ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Structure recommandée du template Word:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[En-tête commun avec logo, adresse, etc.]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "{#isDesignation}" -ForegroundColor Cyan
    Write-Host "Paris, le {date}" -ForegroundColor White
    Write-Host "{civiliteDestinataire} {nomDestinataire}" -ForegroundColor White
    Write-Host "..." -ForegroundColor Gray
    Write-Host "[Tout le contenu spécifique à la DÉSIGNATION]" -ForegroundColor White
    Write-Host "..." -ForegroundColor Gray
    Write-Host "Cordialement," -ForegroundColor White
    Write-Host "{signatureExp}" -ForegroundColor White
    Write-Host "[SAUT DE PAGE - Ctrl+Entrée]" -ForegroundColor Green
    Write-Host "{/isDesignation}" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "{#isMandatNego}" -ForegroundColor Cyan
    Write-Host "Paris, le {date}" -ForegroundColor White
    Write-Host "{civiliteDestinataire} {nomDestinataire}" -ForegroundColor White
    Write-Host "..." -ForegroundColor Gray
    Write-Host "[Tout le contenu spécifique au MANDAT DE NÉGOCIATION]" -ForegroundColor White
    Write-Host "..." -ForegroundColor Gray
    Write-Host "Cordialement," -ForegroundColor White
    Write-Host "{signatureExp}" -ForegroundColor White
    Write-Host "[SAUT DE PAGE - Ctrl+Entrée]" -ForegroundColor Green
    Write-Host "{/isMandatNego}" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Chaque section doit être COMPLÈTE et INDÉPENDANTE" -ForegroundColor Yellow
    Write-Host "💡 Les sauts de page doivent être AVANT les balises de fermeture {/...}" -ForegroundColor Yellow
    Write-Host "💡 Aucun contenu ne doit être partagé entre les sections" -ForegroundColor Yellow

} finally {
    # Nettoyer
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}

Write-Host "`n=== Analyse terminee ===" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Corrige le template Word si necessaire" -ForegroundColor White
Write-Host "2. Redemarre n8n: docker restart n8n-local" -ForegroundColor White
Write-Host "3. Teste le workflow avec un appel webhook" -ForegroundColor White

