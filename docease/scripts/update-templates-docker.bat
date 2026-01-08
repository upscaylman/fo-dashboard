@echo off
REM Script pour copier les templates Word mis à jour dans Docker
REM Exécuter après avoir modifié les templates dans Word

echo === Mise à jour des templates Word dans Docker ===

set TEMPLATES_DIR=%~dp0..\templates\word
set DOCKER_CONTAINER=n8n-local
set DOCKER_PATH=/templates/word

echo.
echo Source: %TEMPLATES_DIR%
echo Destination: %DOCKER_CONTAINER%:%DOCKER_PATH%
echo.

REM Copier template_convocation_bureau.docx
echo Copie de template_convocation_bureau.docx...
docker cp "%TEMPLATES_DIR%\template_convocation_bureau.docx" %DOCKER_CONTAINER%:%DOCKER_PATH%/template_convocation_bureau.docx
if %errorlevel% neq 0 (
    echo ERREUR: Impossible de copier template_convocation_bureau.docx
) else (
    echo OK: template_convocation_bureau.docx copié
)

REM Copier template_convocation_CA.docx
echo Copie de template_convocation_CA.docx...
docker cp "%TEMPLATES_DIR%\template_convocation_CA.docx" %DOCKER_CONTAINER%:%DOCKER_PATH%/template_convocation_CA.docx
if %errorlevel% neq 0 (
    echo ERREUR: Impossible de copier template_convocation_CA.docx
) else (
    echo OK: template_convocation_CA.docx copié
)

echo.
echo === Terminé ===
echo.
echo N'oubliez pas de tester la génération de convocations !
pause
