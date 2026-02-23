# Script de test pour les notifications Windows

Write-Host "Test des notifications Windows..." -ForegroundColor Cyan
Write-Host ""

# Test 1 : Toast notification (Windows 10/11)
Write-Host "Test 1: Toast notification..." -ForegroundColor Yellow
try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
    
    $appId = 'n8n-automate-test'
    
    $toastXml = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>Test Notification</text>
            <text>Si vous voyez ce message, les notifications fonctionnent !</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default" />
</toast>
"@
    
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($toastXml)
    
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
    
    Write-Host "Toast notification envoyee avec succes !" -ForegroundColor Green
    Write-Host "Verifiez le coin inferieur droit de votre ecran" -ForegroundColor Gray
}
catch {
    Write-Host "Erreur toast notification: $_" -ForegroundColor Red
    
    # Test 2 : Balloon tip classique
    Write-Host ""
    Write-Host "Test 2: Balloon tip classique..." -ForegroundColor Yellow
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        
        $notification = New-Object System.Windows.Forms.NotifyIcon
        $notification.Icon = [System.Drawing.SystemIcons]::Information
        $notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
        $notification.BalloonTipText = "Si vous voyez ce message, les notifications fonctionnent !"
        $notification.BalloonTipTitle = "Test Notification"
        $notification.Visible = $True
        $notification.ShowBalloonTip(10000)
        
        Write-Host "Balloon tip envoyee avec succes !" -ForegroundColor Green
        Write-Host "Verifiez la barre des taches" -ForegroundColor Gray
        
        Start-Sleep -Seconds 5
        $notification.Dispose()
    }
    catch {
        Write-Host "Erreur balloon tip: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test termine !" -ForegroundColor Cyan
Write-Host ""
pause

