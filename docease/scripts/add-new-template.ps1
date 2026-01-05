# Script pour ajouter un nouveau template facilement
# Usage: .\scripts\add-new-template.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$TemplateKey,
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateName,
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateFile
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🎨 Assistant d'Ajout de Nouveau Template              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$ConfigPath = Join-Path $RootDir "templates\config\variables.json"
$WordDir = Join-Path $RootDir "templates\word"

# Vérifier que le fichier de config existe
if (-not (Test-Path $ConfigPath)) {
    Write-Host "❌ Erreur: Fichier de configuration non trouvé: $ConfigPath" -ForegroundColor Red
    exit 1
}

# Mode interactif si pas de paramètres
if (-not $TemplateKey) {
    Write-Host "📝 Informations du nouveau template" -ForegroundColor Yellow
    Write-Host ""
    
    $TemplateKey = Read-Host "Clé du template (ex: convocation, demission, etc.)"
    $TemplateName = Read-Host "Nom affiché (ex: Lettre de Convocation)"
    $TemplateFile = Read-Host "Nom du fichier .docx (ex: template_convocation.docx)"
}

# Validation
if (-not $TemplateKey -or -not $TemplateName -or -not $TemplateFile) {
    Write-Host "❌ Erreur: Tous les champs sont requis" -ForegroundColor Red
    exit 1
}

# Vérifier que le fichier .docx existe
$TemplateFilePath = Join-Path $WordDir $TemplateFile
if (-not (Test-Path $TemplateFilePath)) {
    Write-Host "⚠️  Le fichier $TemplateFile n'existe pas encore dans templates/word/" -ForegroundColor Yellow
    $create = Read-Host "Voulez-vous continuer quand même? (o/n)"
    if ($create -ne "o") {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Résumé:" -ForegroundColor Cyan
Write-Host "  - Clé: $TemplateKey" -ForegroundColor Gray
Write-Host "  - Nom: $TemplateName" -ForegroundColor Gray
Write-Host "  - Fichier: $TemplateFile" -ForegroundColor Gray
Write-Host ""

# Demander les variables spécifiques
Write-Host "🔧 Variables spécifiques (en plus des variables communes)" -ForegroundColor Yellow
Write-Host "   Appuyez sur Entrée sans rien taper pour terminer" -ForegroundColor Gray
Write-Host ""

$variables = @{}
$varIndex = 1

while ($true) {
    Write-Host "Variable #$varIndex" -ForegroundColor Cyan
    $varKey = Read-Host "  Nom de la variable (ex: objet, numeroCourrier)"
    
    if (-not $varKey) {
        break
    }
    
    $varLabel = Read-Host "  Label affiché"
    $varType = Read-Host "  Type (text/email/select/textarea)"
    $varRequired = Read-Host "  Requis? (o/n)"
    
    $varConfig = @{
        label = $varLabel
        type = $varType
        required = ($varRequired -eq "o")
    }
    
    if ($varType -eq "select") {
        $options = Read-Host "  Options (séparées par virgule)"
        $varConfig.options = $options -split "," | ForEach-Object { $_.Trim() }
    }
    
    $placeholder = Read-Host "  Placeholder (optionnel)"
    if ($placeholder) {
        $varConfig.placeholder = $placeholder
    }
    
    $variables[$varKey] = $varConfig
    $varIndex++
    Write-Host ""
}

# Charger la configuration actuelle
$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json

# Vérifier si le template existe déjà
if ($config.templates.PSObject.Properties.Name -contains $TemplateKey) {
    Write-Host "⚠️  Le template '$TemplateKey' existe déjà!" -ForegroundColor Yellow
    $overwrite = Read-Host "Voulez-vous l'écraser? (o/n)"
    if ($overwrite -ne "o") {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 1
    }
}

# Créer le nouveau template
$newTemplate = @{
    nom = $TemplateName
    fichier = $TemplateFile
    description = ""
    variables_specifiques = $variables
}

# Ajouter ou mettre à jour le template
if (-not $config.templates) {
    $config | Add-Member -MemberType NoteProperty -Name "templates" -Value @{}
}

$config.templates | Add-Member -MemberType NoteProperty -Name $TemplateKey -Value $newTemplate -Force

# Sauvegarder la configuration
$config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8

Write-Host ""
Write-Host "✅ Template '$TemplateKey' ajouté avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Créez le fichier Word: templates/word/$TemplateFile" -ForegroundColor Gray
Write-Host "  2. Ajoutez les variables dans le Word avec la syntaxe: {nomVariable}" -ForegroundColor Gray
Write-Host "  3. Variables communes disponibles:" -ForegroundColor Gray
Write-Host "     - {civiliteDestinataire}, {nomDestinataire}, {statutDestinataire}" -ForegroundColor DarkGray
Write-Host "     - {batiment}, {adresse}, {cpVille}" -ForegroundColor DarkGray
Write-Host "     - {emailDestinataire}, {signatureExp}" -ForegroundColor DarkGray
Write-Host "     - {date}, {dateComplete}, {heure}" -ForegroundColor DarkGray
Write-Host "     - {codeDocument}, {entreprise}" -ForegroundColor DarkGray
Write-Host "  4. Variables spécifiques ajoutées:" -ForegroundColor Gray
foreach ($varKey in $variables.Keys) {
    Write-Host "     - {$varKey}" -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "  5. Testez le formulaire: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Le workflow n8n utilisera automatiquement ce nouveau template!" -ForegroundColor Green
Write-Host "   Aucune modification du workflow n'est nécessaire." -ForegroundColor Green
Write-Host ""

