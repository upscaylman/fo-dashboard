# Script pour tester le Realtime en envoyant un document DocEase

Write-Host "🧪 Test d'envoi de document DocEase pour vérifier le Realtime..." -ForegroundColor Cyan

$response = Invoke-WebRequest `
  -Uri "https://geljwonckfmdkaywaxly.supabase.co/functions/v1/docease-webhook" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ"
    "x-api-key" = "fo-metaux-docease-2025"
    "Content-Type" = "application/json"
  } `
  -Body '{"user_email": "test@exemple.com", "document_type": "test_realtime", "title": "Test Realtime ' + (Get-Date -Format "HH:mm:ss") + '.docx", "metadata": {"format": "docx", "test": true}}' `
  -UseBasicParsing

if ($response.StatusCode -eq 200) {
  Write-Host "✅ Document envoyé ! Vérifie le dashboard, les stats doivent se mettre à jour automatiquement" -ForegroundColor Green
  $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} else {
  Write-Host "❌ Erreur: $($response.StatusCode)" -ForegroundColor Red
}
