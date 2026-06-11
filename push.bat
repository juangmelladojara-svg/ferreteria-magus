@echo off
set GITHUB_TOKEN=
set PATH=%PATH%;C:\Program Files\Git\cmd
set GIT="C:\Program Files\Git\cmd\git.exe"
set GH="C:\Program Files\GitHub CLI\gh.exe"

echo [1/3] Configurando autenticacion...
%GH% auth setup-git

echo [2/3] Agregando cambios...
%GIT% add -A

%GIT% diff --cached --quiet
if %errorlevel% == 0 (
  echo No hay cambios nuevos para subir.
  goto :fin
)

echo [3/3] Subiendo a GitHub...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set hoy=%%c-%%b-%%a
%GIT% commit -m "Actualizar sitio %hoy%"
%GIT% push origin main

echo.
echo ============================================
echo  SITIO ACTUALIZADO:
echo  https://juangmelladojara-svg.github.io/ferreteria-magus/
echo ============================================

:fin
