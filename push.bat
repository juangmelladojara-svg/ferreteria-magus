@echo off
set GITHUB_TOKEN=
set PATH=%PATH%;C:\Program Files\Git\cmd
set GIT="C:\Program Files\Git\cmd\git.exe"
set GH="C:\Program Files\GitHub CLI\gh.exe"

echo Agregando archivos nuevos...
%GIT% add -A
%GIT% status

%GIT% diff --cached --quiet
if %errorlevel% == 0 (
  echo No hay cambios nuevos para subir.
) else (
  echo Haciendo commit...
  %GIT% commit -m "Actualizar catalogo y productos - %date%"
  echo Subiendo a GitHub...
  %GIT% push origin main
  echo.
  echo OK! Sitio actualizado en:
  echo https://juangmelladojara-svg.github.io/ferreteria-magus/
)
pause
