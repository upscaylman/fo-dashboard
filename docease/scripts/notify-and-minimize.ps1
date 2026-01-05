# Script pour afficher une notification Windows et minimiser la fenêtre
param(
    [string]$Title = "Notification",
    [string]$Message = "Message",
    [int]$Duration = 5
)

# Afficher une notification Windows
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$notification = New-Object System.Windows.Forms.NotifyIcon
$notification.Icon = [System.Drawing.SystemIcons]::Information
$notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
$notification.BalloonTipText = $Message
$notification.BalloonTipTitle = $Title
$notification.Visible = $True
$notification.ShowBalloonTip($Duration * 1000)

# Attendre que la notification soit affichée
Start-Sleep -Seconds 1

# Nettoyer
$notification.Dispose()

