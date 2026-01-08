# fix-convocation-templates.ps1
# Script pour corriger la syntaxe des templates Word de convocation
# Remplace la syntaxe rawxml {-w:p VAR}{VAR}{/VAR} par la syntaxe simple {VAR}

param(
    [string]$TemplatesDir = "$PSScriptRoot\..\templates\word"
)

$ErrorActionPreference = "Stop"

function Repair-TemplateXml {
    param([string]$XmlContent)
    
    # Liste des variables à corriger
    $variables = @(
        "dateDebut", "heureDebut", "dateFin", "heureFin",
        "ordreDuJour1", "ordreDuJour2", "ordreDuJour3", "ordreDuJour4",
        "ordreDuJour5", "ordreDuJour6", "ordreDuJour7", "ordreDuJour8",
        "codeDocument"
    )
    
    $modified = $XmlContent
    
    foreach ($var in $variables) {
        # Pattern 1: Syntaxe complète sans fragmentation XML
        # {-w:p VAR}{VAR}{/VAR} -> {VAR}
        $pattern1 = "\{-w:p\s+$var\}\{$var\}\{/$var\}"
        $modified = [regex]::Replace($modified, $pattern1, "{$var}")
        
        # Pattern 2: Syntaxe fragmentée par les balises XML Word
        # Pour dateDebut: {-w:p date</w:t>...Debut}{date...Debut}{/date...Debut}
        # C'est plus complexe car Word fragmente le texte
    }
    
    return $modified
}

function Repair-DocxTemplate {
    param([string]$DocxPath)
    
    Write-Host "`n=== Traitement de $DocxPath ===" -ForegroundColor Cyan
    
    # Vérifier que le fichier existe
    if (-not (Test-Path $DocxPath)) {
        Write-Host "ERREUR: Fichier non trouvé: $DocxPath" -ForegroundColor Red
        return $false
    }
    
    # Créer une sauvegarde
    $backupPath = "$DocxPath.backup"
    Copy-Item $DocxPath $backupPath -Force
    Write-Host "Sauvegarde créée: $backupPath" -ForegroundColor Green
    
    # Créer un dossier temporaire
    $tempDir = Join-Path $env:TEMP "docx_temp_$(Get-Date -Format 'yyyyMMddHHmmss')"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    try {
        # Extraire le fichier DOCX (c'est un ZIP)
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($DocxPath, $tempDir)
        
        # Lire le document.xml
        $documentXmlPath = Join-Path $tempDir "word\document.xml"
        $content = Get-Content $documentXmlPath -Raw -Encoding UTF8
        
        # Appliquer les corrections
        $originalContent = $content
        
        # Remplacements manuels pour les patterns connus
        # Ces patterns sont fragmentés par Word, donc on doit les traiter spécifiquement
        
        # Pattern pour {-w:p dateDebut}{dateDebut}{/dateDebut}
        $content = $content -replace '\{-w:p dateDebut\}\{dateDebut\}\{/dateDebut\}', '{dateDebut}'
        $content = $content -replace '\{-w:p heureDebut\}\{heureDebut\}\{/heureDebut\}', '{heureDebut}'
        $content = $content -replace '\{-w:p dateFin\}\{dateFin\}\{/dateFin\}', '{dateFin}'
        $content = $content -replace '\{-w:p heureFin\}\{heureFin\}\{/heureFin\}', '{heureFin}'
        $content = $content -replace '\{-w:p ordreDuJour1\}\{ordreDuJour1\}\{/ordreDuJour1\}', '{ordreDuJour1}'
        $content = $content -replace '\{-w:p ordreDuJour2\}\{ordreDuJour2\}\{/ordreDuJour2\}', '{ordreDuJour2}'
        $content = $content -replace '\{-w:p ordreDuJour3\}\{ordreDuJour3\}\{/ordreDuJour3\}', '{ordreDuJour3}'
        $content = $content -replace '\{-w:p ordreDuJour4\}\{ordreDuJour4\}\{/ordreDuJour4\}', '{ordreDuJour4}'
        $content = $content -replace '\{-w:p ordreDuJour5\}\{ordreDuJour5\}\{/ordreDuJour5\}', '{ordreDuJour5}'
        $content = $content -replace '\{-w:p ordreDuJour6\}\{ordreDuJour6\}\{/ordreDuJour6\}', '{ordreDuJour6}'
        $content = $content -replace '\{-w:p ordreDuJour7\}\{ordreDuJour7\}\{/ordreDuJour7\}', '{ordreDuJour7}'
        $content = $content -replace '\{-w:p ordreDuJour8\}\{ordreDuJour8\}\{/ordreDuJour8\}', '{ordreDuJour8}'
        
        # Pattern pour les fragments XML (le texte est coupé par les balises Word)
        # Exemple: {-w:p date</w:t></w:r><w:r...><w:t>Debut}
        # On doit reconstruire ces patterns
        
        # Pattern général: supprimer les constructions {-w:p ...}{...}{/...}
        # et les remplacer par juste {variable}
        
        # Rechercher les patterns fragmentés pour dateDebut
        $fragPattern = '\{-w:p date</w:t></w:r><w:r[^>]*><w:rPr>[^<]*</w:rPr><w:t>Debut\}\{date</w:t></w:r><w:r[^>]*><w:rPr>[^<]*</w:rPr><w:t>Debut\}\{/date</w:t></w:r><w:r[^>]*><w:rPr>[^<]*</w:rPr><w:t>Debut\}'
        $content = [regex]::Replace($content, $fragPattern, '{dateDebut}')
        
        # Vérifier si des modifications ont été faites
        if ($content -ne $originalContent) {
            Write-Host "Modifications appliquées!" -ForegroundColor Green
            
            # Écrire le contenu modifié
            Set-Content $documentXmlPath -Value $content -Encoding UTF8 -NoNewline
            
            # Supprimer l'ancien fichier DOCX
            Remove-Item $DocxPath -Force
            
            # Recréer le fichier DOCX à partir du dossier temporaire
            [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $DocxPath)
            
            Write-Host "Template corrigé: $DocxPath" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "Aucune modification nécessaire (patterns non trouvés ou déjà corrigés)" -ForegroundColor Yellow
            return $false
        }
    }
    finally {
        # Nettoyer le dossier temporaire
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force
        }
    }
}

# Main
Write-Host "=== Correction des templates de convocation ===" -ForegroundColor Cyan
Write-Host "Dossier des templates: $TemplatesDir"

$templatesToFix = @(
    "template_convocation_bureau.docx",
    "template_convocation_CA.docx"
)

$fixedCount = 0
foreach ($template in $templatesToFix) {
    $templatePath = Join-Path $TemplatesDir $template
    if (Repair-DocxTemplate -DocxPath $templatePath) {
        $fixedCount++
    }
}

Write-Host "`n=== Résumé ===" -ForegroundColor Cyan
Write-Host "$fixedCount template(s) corrigé(s)"

if ($fixedCount -gt 0) {
    Write-Host "`nN'oubliez pas de copier les templates dans Docker !"
    Write-Host "Exécutez: .\update-templates-docker.bat"
}

Write-Host "`nTerminé!" -ForegroundColor Green
