# ============================================
# Serveur HTTP PowerShell Multi-Services
# Sert le build React (dist/) + proxy n8n + health check + convert-pdf
# ============================================

Write-Host "Demarrage du serveur de formulaire..." -ForegroundColor Cyan

$Port = 8080
$N8nUrl = "http://localhost:5678"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistDir = Join-Path $ScriptDir "dist"

# Verifier que le build existe
if (-not (Test-Path (Join-Path $DistDir "index.html"))) {
    Write-Host "[ERREUR] Le dossier dist/ n'existe pas. Lancez 'npm run build' d'abord." -ForegroundColor Red
    exit 1
}

# Liberer le port si un listener HTTP.sys orphelin existe
$PortInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($PortInUse) {
    $ownerPid = ($PortInUse | Select-Object -First 1).OwningProcess
    $ownerProc = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
    if ($ownerPid -eq 4 -or $ownerProc.ProcessName -eq "System") {
        Write-Host "[INFO] Listener HTTP.sys orphelin detecte sur le port $Port, nettoyage..." -ForegroundColor Yellow
        # Tenter de supprimer les reservations HTTP.sys orphelines
        netsh http delete urlacl url=http://+:$Port/ 2>$null
        netsh http delete urlacl url=http://localhost:$Port/ 2>$null
        Start-Sleep 1
    } else {
        Write-Host "[ATTENTION] Le port $Port est utilise par $($ownerProc.ProcessName) (PID $ownerPid)." -ForegroundColor Yellow
        Write-Host "[ATTENTION] Arretez ce processus d'abord ou utilisez stop.bat" -ForegroundColor Yellow
        exit 1
    }
}

# Fonction pour determiner le Content-Type
function Get-MimeType {
    param([string]$Extension)
    switch ($Extension.ToLower()) {
        ".html"  { "text/html; charset=utf-8" }
        ".css"   { "text/css; charset=utf-8" }
        ".js"    { "application/javascript; charset=utf-8" }
        ".json"  { "application/json; charset=utf-8" }
        ".svg"   { "image/svg+xml" }
        ".png"   { "image/png" }
        ".jpg"   { "image/jpeg" }
        ".jpeg"  { "image/jpeg" }
        ".gif"   { "image/gif" }
        ".ico"   { "image/x-icon" }
        ".woff"  { "font/woff" }
        ".woff2" { "font/woff2" }
        ".ttf"   { "font/ttf" }
        ".webp"  { "image/webp" }
        ".webm"  { "video/webm" }
        ".mp4"   { "video/mp4" }
        ".xml"   { "application/xml" }
        ".txt"   { "text/plain; charset=utf-8" }
        ".map"   { "application/json" }
        default  { "application/octet-stream" }
    }
}

# Fonction principale de traitement des requetes
function Handle-Request {
    param(
        [System.Net.HttpListenerContext]$Context
    )
    
    $Request = $Context.Request
    $Response = $Context.Response
    
    Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] $($Request.HttpMethod) $($Request.Url.PathAndQuery)" -ForegroundColor Gray
    
    # Headers CORS sur toutes les reponses
    $Response.Headers.Add("Access-Control-Allow-Origin", "*")
    $Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning")
    
    # Preflight CORS
    if ($Request.HttpMethod -eq "OPTIONS") {
        $Response.StatusCode = 204
        $Response.Close()
        return
    }
    
    $Path = $Request.Url.AbsolutePath

    # ============================================
    # HEALTH CHECK
    # ============================================
    if ($Path -eq "/api/health") {
        try {
            # Verifier reellement que n8n repond
            $n8nOk = $false
            $ollamaOk = $false
            try {
                $null = Invoke-WebRequest -Uri "http://localhost:5678" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                $n8nOk = $true
            } catch {}
            try {
                $null = Invoke-WebRequest -Uri "http://localhost:11434" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                $ollamaOk = $true
            } catch {}

            $status = if ($n8nOk) { "ok" } else { "degraded" }
            $healthResponse = @{
                status = $status
                services = @{
                    n8n = if ($n8nOk) { "up" } else { "down" }
                    ollama = if ($ollamaOk) { "up" } else { "down" }
                }
                timestamp = [DateTime]::Now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                service = "PowerShell Server"
            } | ConvertTo-Json

            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($healthResponse)

            try {
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $Buffer.Length
                $Response.StatusCode = if ($n8nOk) { 200 } else { 503 }
                $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
                Write-Host "[HEALTH] Health check: $status (n8n=$(if($n8nOk){'up'}else{'down'}), ollama=$(if($ollamaOk){'up'}else{'down'}))" -ForegroundColor $(if($n8nOk){'Green'}else{'Yellow'})
            } catch {
                Write-Host "[WARNING] Erreur envoi health check: $_" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[ERROR] Health check failed: $_" -ForegroundColor Red
            try { $Response.StatusCode = 500 } catch {}
        }
    }
    # ============================================
    # PROXY VERS N8N (tous les /webhook/*)
    # ============================================
    elseif ($Path -like "/webhook/*") {
        Write-Host "[PROXY] Redirection vers n8n: $Path" -ForegroundColor Magenta

        try {
            $reader = New-Object System.IO.StreamReader($Request.InputStream, $Request.ContentEncoding)
            $RequestBody = $reader.ReadToEnd()
            $reader.Close()

            $proxyUrl = "$N8nUrl$Path"
            Write-Host "[PROXY] -> $proxyUrl (body: $($RequestBody.Length) chars)" -ForegroundColor Gray

            $headers = @{ "Content-Type" = "application/json" }

            $proxyResponse = Invoke-RestMethod -Uri $proxyUrl `
                -Method POST `
                -Body $RequestBody `
                -Headers $headers `
                -TimeoutSec 300

            $result = $proxyResponse | ConvertTo-Json -Depth 10 -Compress
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($result)

            try {
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $Buffer.Length
                $Response.StatusCode = 200
                $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
                $Response.OutputStream.Flush()
                Write-Host "[PROXY] OK ($($Buffer.Length) bytes)" -ForegroundColor Green
            } catch {
                Write-Host "[WARNING] Erreur envoi reponse proxy: $_" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[ERROR] Erreur proxy n8n: $($_.Exception.Message)" -ForegroundColor Red
            $errorJson = @{ error = "Erreur proxy n8n: $($_.Exception.Message)"; success = $false } | ConvertTo-Json
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($errorJson)
            try {
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $Buffer.Length
                $Response.StatusCode = 500
                $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            } catch {}
        }
    }
    # ============================================
    # CONVERSION PDF
    # ============================================
    elseif ($Path -eq "/api/convert-pdf" -and $Request.HttpMethod -eq "POST") {
        try {
            Write-Host "[PDF] Reception requete conversion" -ForegroundColor Cyan

            $reader = New-Object System.IO.StreamReader($Request.InputStream)
            $jsonBody = $reader.ReadToEnd()
            $reader.Close()

            $data = $jsonBody | ConvertFrom-Json
            $wordBase64 = $data.wordBase64
            $filename = if ($data.filename) { $data.filename } else { "document" }

            Write-Host "[PDF] Fichier: $filename.docx ($($wordBase64.Length) chars base64)" -ForegroundColor Cyan
            
            $wordBytes = [System.Convert]::FromBase64String($wordBase64)
            
            $tempWordFile = [System.IO.Path]::GetTempFileName() + ".docx"
            [System.IO.File]::WriteAllBytes($tempWordFile, $wordBytes)
            
            $tempPdfFile = [System.IO.Path]::GetTempFileName() + ".pdf"
            
            try {
                $Word = New-Object -ComObject Word.Application
                $Word.Visible = $false
                $Word.DisplayAlerts = 0
                
                $Doc = $Word.Documents.Open($tempWordFile)
                Start-Sleep -Seconds 5
                
                # ExportFormat 17 = wdExportFormatPDF
                $Doc.ExportAsFixedFormat($tempPdfFile, 17, $false, 0, 0, 0, 0, 0, $true)
                
                $Doc.Close($false)
                $Word.Quit()
                
                [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Doc) | Out-Null
                [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Word) | Out-Null
                [System.GC]::Collect()
                [System.GC]::WaitForPendingFinalizers()
            } catch {
                if ($Doc) { $Doc.Close($false) }
                if ($Word) { $Word.Quit() }
                throw "Erreur conversion Word: $($_.Exception.Message)"
            }
            
            if (Test-Path $tempPdfFile) {
                $pdfBytes = [System.IO.File]::ReadAllBytes($tempPdfFile)
                Remove-Item $tempWordFile -Force -ErrorAction SilentlyContinue
                Remove-Item $tempPdfFile -Force -ErrorAction SilentlyContinue
                
                $pdfBase64 = [System.Convert]::ToBase64String($pdfBytes)
                $result = @{ pdfBase64 = $pdfBase64 } | ConvertTo-Json
                $Buffer = [System.Text.Encoding]::UTF8.GetBytes($result)

                try {
                    $Response.ContentType = "application/json; charset=utf-8"
                    $Response.ContentLength64 = $Buffer.Length
                    $Response.StatusCode = 200
                    $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
                    $Response.OutputStream.Flush()
                    Write-Host "[PDF] OK - $($pdfBytes.Length) bytes" -ForegroundColor Green
                } catch {
                    Write-Host "[WARNING] Erreur envoi PDF: $_" -ForegroundColor Yellow
                }
            } else {
                throw "Fichier PDF non genere"
            }
        } catch {
            Write-Host "[ERROR] Conversion PDF: $($_.Exception.Message)" -ForegroundColor Red
            $errorResult = @{ error = $_.Exception.Message } | ConvertTo-Json
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($errorResult)
            try {
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $Buffer.Length
                $Response.StatusCode = 500
                $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            } catch {}
        }
    }
    # ============================================
    # SERVIR LES FICHIERS STATIQUES (dist/)
    # ============================================
    else {
        # Resoudre le chemin du fichier
        $filePath = $Path.TrimStart("/").Replace("/", "\")
        
        # SPA fallback: si pas de fichier, servir index.html
        if ($filePath -eq "" -or $filePath -eq "index.html") {
            $filePath = "index.html"
        }
        
        $fullPath = Join-Path $DistDir $filePath
        
        # Si le fichier n'existe pas et pas d'extension, c'est une route SPA -> index.html
        if (-not (Test-Path $fullPath)) {
            $ext = [System.IO.Path]::GetExtension($fullPath)
            if ($ext -eq "") {
                $fullPath = Join-Path $DistDir "index.html"
            }
        }

        # Aussi chercher dans le dossier config (variables.json)
        if ($Path -eq "/config/variables.json") {
            $configPath = Join-Path $ScriptDir "..\..\config\variables.json"
            $configPath = [System.IO.Path]::GetFullPath($configPath)
            if (Test-Path $configPath) {
                $fullPath = $configPath
            }
        }
        
        if (Test-Path $fullPath) {
            try {
                $extension = [System.IO.Path]::GetExtension($fullPath)
                $contentType = Get-MimeType $extension
                
                $Buffer = [System.IO.File]::ReadAllBytes($fullPath)
                
                $Response.ContentType = $contentType
                $Response.ContentLength64 = $Buffer.Length
                $Response.StatusCode = 200
                $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            } catch {
                Write-Host "[ERROR] Erreur lecture fichier $fullPath : $_" -ForegroundColor Red
                try { $Response.StatusCode = 500 } catch {}
            }
        } else {
            Write-Host "[404] $Path -> $fullPath" -ForegroundColor Yellow
            try { $Response.StatusCode = 404 } catch {}
        }
    }

    try { $Response.Close() } catch {}
}

# ============================================
# DEMARRAGE DU SERVEUR
# ============================================
$Listener = New-Object System.Net.HttpListener
$ListenUrl = "http://localhost:$Port/"

# Tenter d'ecouter sur toutes les interfaces (necessite admin)
$Listener.Prefixes.Add("http://+:$Port/")

try {
    $Listener.Start()
    $ListenUrl = "http://+:$Port/"
    Write-Host "Ecoute sur toutes les interfaces (http://+:$Port/)" -ForegroundColor Cyan
} catch {
    Write-Host "Droits admin insuffisants pour http://+:$Port/, fallback sur localhost..." -ForegroundColor Yellow
    $Listener.Close()
    $Listener = New-Object System.Net.HttpListener
    $Listener.Prefixes.Add("http://localhost:$Port/")
    $ListenUrl = "http://localhost:$Port/"
    try {
        $Listener.Start()
        Write-Host "Ecoute sur http://localhost:$Port/" -ForegroundColor Cyan
    } catch {
        Write-Host "ERREUR CRITIQUE: Impossible de demarrer le serveur sur le port $Port : $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "============================================" -ForegroundColor Green
Write-Host "  SERVEUR DOCEASE - Port $Port" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Adresses:" -ForegroundColor Cyan
Write-Host "  - Local:      http://localhost:$Port/" -ForegroundColor White

$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if ($localIP) {
    Write-Host "  - Reseau:     http://${localIP}:$Port/" -ForegroundColor White
    Write-Host "  - Docker:     http://host.docker.internal:$Port/" -ForegroundColor White
}

Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  - /*                   -> Fichiers statiques (dist/)" -ForegroundColor White
Write-Host "  - /api/health          -> Health check" -ForegroundColor White
Write-Host "  - /api/convert-pdf     -> Conversion Word -> PDF" -ForegroundColor White
Write-Host "  - /webhook/*           -> Proxy vers n8n ($N8nUrl)" -ForegroundColor White
Write-Host ""
Write-Host "Ctrl+C pour arreter" -ForegroundColor Yellow
Write-Host ""

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        Handle-Request -Context $Context
    }
} catch {
    Write-Host "ERREUR: $_" -ForegroundColor Red
} finally {
    if ($Listener.IsListening) {
        $Listener.Stop()
    }
    Write-Host "Serveur arrete" -ForegroundColor Yellow
}
