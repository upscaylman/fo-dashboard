# Script pour créer un nouveau template Word avec sections conditionnelles

Write-Host "=== CREATION DU NOUVEAU TEMPLATE WORD ===" -ForegroundColor Green
Write-Host ""

# Installer le module si nécessaire
if (-not (Get-Module -ListAvailable -Name PSWriteOffice)) {
    Write-Host "Installation du module PSWriteOffice..." -ForegroundColor Yellow
    Install-Module -Name PSWriteOffice -Force -Scope CurrentUser
}

Write-Host "Chargement du module Word..." -ForegroundColor Yellow

try {
    # Créer une instance Word
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    
    Write-Host "Creation du document..." -ForegroundColor Cyan
    
    # Créer un nouveau document
    $doc = $word.Documents.Add()
    
    # Configuration de la page
    $doc.PageSetup.TopMargin = $word.CentimetersToPoints(0.6)
    $doc.PageSetup.BottomMargin = $word.CentimetersToPoints(0.85)
    $doc.PageSetup.LeftMargin = $word.CentimetersToPoints(0)
    $doc.PageSetup.RightMargin = $word.CentimetersToPoints(0)
    
    Write-Host "Configuration de l'en-tete..." -ForegroundColor Cyan
    
    # EN-TÊTE
    $header = $doc.Sections.Item(1).Headers.Item(1)
    $headerRange = $header.Range
    $headerRange.Text = "{codeDocument}`n`nObjet : Lettre recommandee avec A.R.`nN°{numeroCourrier}`n`n"
    $headerRange.Font.Name = "Arial"
    $headerRange.Font.Size = 11
    $headerRange.Font.Bold = $true
    
    Write-Host "Configuration du pied de page..." -ForegroundColor Cyan
    
    # PIED DE PAGE
    $footer = $doc.Sections.Item(1).Footers.Item(1)
    $footerRange = $footer.Range
    $footerRange.Text = "Paris, le {date}"
    $footerRange.Font.Name = "Aptos"
    $footerRange.Font.Size = 11
    $footerRange.ParagraphFormat.Alignment = 2  # Right align
    
    Write-Host "Ajout du contenu principal..." -ForegroundColor Cyan
    
    # CORPS DU DOCUMENT
    $selection = $word.Selection
    
    # Bloc destinataire (commun)
    $selection.TypeText("Societe {entreprise}")
    $selection.TypeParagraph()
    $selection.TypeText("{civiliteDestinataire} {nomDestinataire}")
    $selection.TypeParagraph()
    $selection.TypeText("{genre} {statutDestinataire}")
    $selection.TypeParagraph()
    if ($true) {
        $selection.TypeText("{batiment}")
        $selection.TypeParagraph()
    }
    $selection.TypeText("{adresse}")
    $selection.TypeParagraph()
    $selection.TypeText("{cpVille}")
    $selection.TypeParagraph()
    $selection.TypeText("{emailDestinataire}")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    # SECTION CONDITIONNELLE : DESIGNATION
    $selection.Font.Color = -16776961  # Rouge
    $selection.Font.Size = 10
    $selection.TypeText("{#isDesignation}")
    $selection.TypeParagraph()
    $selection.Font.Color = 0  # Noir
    $selection.Font.Size = 11
    
    $selection.TypeParagraph()
    $selection.TypeText("Nous vous informons que la Federation FO de la Metallurgie designe en qualite de Delegue Syndical dans votre entreprise:")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    $selection.Font.Bold = $true
    $selection.TypeText("=> {civiliteDelegue} {nomDelegue}")
    $selection.TypeParagraph()
    $selection.Font.Bold = $false
    $selection.TypeText("{emailDelegue}")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    $selection.TypeText("En remplacement de {civiliteRemplace} {nomRemplace}.")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    $selection.TypeText("Nous vous demandons de bien vouloir lui adresser toutes convocations et informations necessaires a l'exercice de son mandat.")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    $selection.TypeText("Veuillez agreer, {civiliteDestinataire}, l'expression de nos sinceres salutations.")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    $selection.TypeText("{signatureExp}")
    $selection.TypeParagraph()
    $selection.TypeText("Secretaire Federal")
    $selection.TypeParagraph()
    
    # Saut de page DANS la section
    $selection.InsertBreak(7)  # wdPageBreak
    
    # Fermeture section DESIGNATION
    $selection.Font.Color = -16776961  # Rouge
    $selection.Font.Size = 10
    $selection.TypeText("{/isDesignation}")
    $selection.TypeParagraph()
    $selection.Font.Color = 0  # Noir
    $selection.Font.Size = 11
    
    # SECTION CONDITIONNELLE : MANDAT NEGOCIATION
    $selection.Font.Color = -16776961  # Rouge
    $selection.Font.Size = 10
    $selection.TypeText("{#isMandatNego}")
    $selection.TypeParagraph()
    $selection.Font.Color = 0  # Noir
    $selection.Font.Size = 11
    
    $selection.TypeParagraph()
    $selection.TypeText("Nous vous informons que la Federation FO de la Metallurgie designe aux fins de negocier, et eventuellement signer le protocole d'accord preelectoral en vue de l'election des membres de la delegation du personnel du comite social et economique de la societe {entreprise}")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    $selection.Font.Bold = $true
    $selection.TypeText("=> {civiliteDelegue} {nomDelegue} ({entreprise})")
    $selection.TypeParagraph()
    $selection.Font.Bold = $false
    $selection.TypeText("{emailDelegue}")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    $selection.TypeText("Veuillez agreer, {civiliteDestinataire}, l'expression de nos sinceres salutations.")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    
    $selection.TypeText("{signatureExp}")
    $selection.TypeParagraph()
    $selection.TypeText("Secretaire Federal")
    $selection.TypeParagraph()
    
    # Saut de page DANS la section
    $selection.InsertBreak(7)  # wdPageBreak
    
    # Fermeture section MANDAT NEGO
    $selection.Font.Color = -16776961  # Rouge
    $selection.Font.Size = 10
    $selection.TypeText("{/isMandatNego}")
    $selection.TypeParagraph()
    
    Write-Host "Sauvegarde du document..." -ForegroundColor Cyan
    
    # Sauvegarder
    $savePath = Join-Path (Get-Location) "templates\word\template_principal_new.docx"
    $doc.SaveAs([ref]$savePath, [ref]16)  # 16 = wdFormatXMLDocument
    
    Write-Host ""
    Write-Host "=== DOCUMENT CREE AVEC SUCCES ===" -ForegroundColor Green
    Write-Host "Emplacement: $savePath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "STRUCTURE DU DOCUMENT:" -ForegroundColor Cyan
    Write-Host "- En-tete: Logo + Objet + Numero courrier" -ForegroundColor White
    Write-Host "- Corps: Bloc destinataire (commun)" -ForegroundColor White
    Write-Host "- Section 1: {#isDesignation}...{/isDesignation} avec saut de page" -ForegroundColor Green
    Write-Host "- Section 2: {#isMandatNego}...{/isMandatNego} avec saut de page" -ForegroundColor Green
    Write-Host "- Pied de page: Date" -ForegroundColor White
    Write-Host ""
    Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
    Write-Host "1. Ouvre le fichier dans Word: $savePath" -ForegroundColor White
    Write-Host "2. Ajoute le logo FO METAUX dans l'en-tete" -ForegroundColor White
    Write-Host "3. Ajuste la mise en forme si necessaire" -ForegroundColor White
    Write-Host "4. Sauvegarde et remplace l'ancien template" -ForegroundColor White
    Write-Host "5. Redemarre n8n: docker restart n8n-local" -ForegroundColor White
    
    # Fermer
    $doc.Close()
    $word.Quit()
    
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    
    Write-Host ""
    Write-Host "Veux-tu ouvrir le document maintenant? (O/N)" -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq "O" -or $response -eq "o") {
        Start-Process $savePath
    }
    
} catch {
    Write-Host ""
    Write-Host "ERREUR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Le script a echoue. Je vais creer un document manuel a la place..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "INSTRUCTIONS MANUELLES:" -ForegroundColor Cyan
    Write-Host "1. Ouvre Word et cree un nouveau document" -ForegroundColor White
    Write-Host "2. Configure les marges (Mise en page > Marges):" -ForegroundColor White
    Write-Host "   - Haut: 0.6 cm" -ForegroundColor Gray
    Write-Host "   - Bas: 0.85 cm" -ForegroundColor Gray
    Write-Host "   - Gauche: 0 cm" -ForegroundColor Gray
    Write-Host "   - Droite: 0 cm" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. EN-TETE (Insertion > En-tete):" -ForegroundColor White
    Write-Host "   [Logo FO METAUX]" -ForegroundColor Gray
    Write-Host "   {codeDocument}" -ForegroundColor Gray
    Write-Host "   " -ForegroundColor Gray
    Write-Host "   Objet : Lettre recommandee avec A.R." -ForegroundColor Gray
    Write-Host "   N°{numeroCourrier}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. CORPS DU DOCUMENT:" -ForegroundColor White
    Write-Host "   Societe {entreprise}" -ForegroundColor Gray
    Write-Host "   {civiliteDestinataire} {nomDestinataire}" -ForegroundColor Gray
    Write-Host "   {genre} {statutDestinataire}" -ForegroundColor Gray
    Write-Host "   {batiment}" -ForegroundColor Gray
    Write-Host "   {adresse}" -ForegroundColor Gray
    Write-Host "   {cpVille}" -ForegroundColor Gray
    Write-Host "   {emailDestinataire}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   {#isDesignation}" -ForegroundColor Red
    Write-Host "   [Contenu designation complet]" -ForegroundColor Gray
    Write-Host "   [SAUT DE PAGE - Ctrl+Entree]" -ForegroundColor Green
    Write-Host "   {/isDesignation}" -ForegroundColor Red
    Write-Host ""
    Write-Host "   {#isMandatNego}" -ForegroundColor Red
    Write-Host "   [Contenu mandat negociation complet]" -ForegroundColor Gray
    Write-Host "   [SAUT DE PAGE - Ctrl+Entree]" -ForegroundColor Green
    Write-Host "   {/isMandatNego}" -ForegroundColor Red
    Write-Host ""
    Write-Host "5. PIED DE PAGE (Insertion > Pied de page):" -ForegroundColor White
    Write-Host "   Paris, le {date}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "6. Sauvegarde sous: templates\word\template_principal_new.docx" -ForegroundColor White
    
    if ($word) {
        $word.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
}

