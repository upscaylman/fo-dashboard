# Wrapper pour demarrer le serveur avec notification et minimisation
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$host.UI.RawUI.WindowTitle = "DocEase - Serveur Port 8080"

# Notification Windows
try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $notification = New-Object System.Windows.Forms.NotifyIcon
    $notification.Icon = [System.Drawing.SystemIcons]::Information
    $notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
    $notification.BalloonTipText = "Serveur DocEase demarre sur http://localhost:8080"
    $notification.BalloonTipTitle = "DocEase"
    $notification.Visible = $True
    $notification.ShowBalloonTip(5000)
    Start-Sleep -Seconds 2
    $notification.Dispose()
} catch {}

# Minimiser la fenetre
try {
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class Window {
        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        [DllImport("kernel32.dll")]
        public static extern IntPtr GetConsoleWindow();
    }
"@
    $consolePtr = [Window]::GetConsoleWindow()
    [Window]::ShowWindow($consolePtr, 2) | Out-Null
} catch {}

# Demarrer le serveur
& "$ScriptDir\serve-form.ps1"
