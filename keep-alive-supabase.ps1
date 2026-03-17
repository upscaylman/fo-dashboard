# keep-alive-supabase.ps1
# Ping Supabase toutes les 3 jours pour empecher la pause du free tier (7j inactivite)
# Usage:
#   .\keep-alive-supabase.ps1           → Ping une fois (mode manuel)
#   .\keep-alive-supabase.ps1 -Install  → Installe une tache planifiee Windows (toutes les 3 jours)
#   .\keep-alive-supabase.ps1 -Remove   → Supprime la tache planifiee

param(
    [switch]$Install,
    [switch]$Remove
)

$SUPABASE_URL = "https://geljwonckfmdkaywaxly.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ"
$TASK_NAME = "FO-Metaux-Supabase-KeepAlive"
$LOG_FILE = Join-Path $PSScriptRoot "keep-alive-supabase.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $Message"
    Write-Host $entry
    Add-Content -Path $LOG_FILE -Value $entry -ErrorAction SilentlyContinue
}

function Ping-Supabase {
    Write-Log "Ping Supabase..."

    # 1. Ping REST API (PostgREST)
    try {
        $headers = @{
            "apikey" = $SUPABASE_ANON_KEY
            "Authorization" = "Bearer $SUPABASE_ANON_KEY"
        }
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/" -Headers $headers -Method Head -TimeoutSec 15 -ErrorAction Stop
        Write-Log "REST API: OK"
    }
    catch {
        Write-Log "REST API: ERREUR - $($_.Exception.Message)"
    }

    # 2. Ping Auth API
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/settings" -Headers @{ "apikey" = $SUPABASE_ANON_KEY } -TimeoutSec 15 -ErrorAction Stop
        Write-Log "Auth API: OK"
    }
    catch {
        Write-Log "Auth API: ERREUR - $($_.Exception.Message)"
    }

    # 3. Ping Edge Function (db-proxy)
    try {
        $body = @{ table = "users"; select = "id"; limit = 1 } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/db-proxy" -Method Post -Headers @{
            "Authorization" = "Bearer $SUPABASE_ANON_KEY"
            "apikey" = $SUPABASE_ANON_KEY
            "Content-Type" = "application/json"
        } -Body $body -TimeoutSec 15 -ErrorAction Stop
        Write-Log "Edge Function (db-proxy): OK"
    }
    catch {
        Write-Log "Edge Function: ERREUR - $($_.Exception.Message)"
    }

    Write-Log "Ping termine."
    Write-Log "---"
}

function Install-Task {
    Write-Log "Installation de la tache planifiee '$TASK_NAME'..."

    $scriptPath = $MyInvocation.ScriptName
    if (-not $scriptPath) { $scriptPath = $PSCommandPath }

    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
    # Toutes les 3 jours
    $trigger = New-ScheduledTaskTrigger -Daily -DaysInterval 3 -At "10:00AM"
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

    try {
        Register-ScheduledTask -TaskName $TASK_NAME -Action $action -Trigger $trigger -Settings $settings -Description "Ping Supabase pour empecher la pause du free tier" -Force
        Write-Log "Tache '$TASK_NAME' installee avec succes (toutes les 3 jours a 10h)"
        Write-Host ""
        Write-Host "Tache planifiee installee. Verifiez avec:" -ForegroundColor Green
        Write-Host "  Get-ScheduledTask -TaskName '$TASK_NAME'" -ForegroundColor Cyan
    }
    catch {
        Write-Log "ERREUR installation: $($_.Exception.Message)"
        Write-Host "Essayez en tant qu'administrateur (clic droit → Executer en tant qu'admin)" -ForegroundColor Red
    }
}

function Remove-Task {
    try {
        Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
        Write-Log "Tache '$TASK_NAME' supprimee."
        Write-Host "Tache supprimee." -ForegroundColor Green
    }
    catch {
        Write-Log "Tache non trouvee ou erreur: $($_.Exception.Message)"
    }
}

# Main
if ($Install) {
    Install-Task
}
elseif ($Remove) {
    Remove-Task
}
else {
    Ping-Supabase
}
