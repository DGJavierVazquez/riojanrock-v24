@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "RIOJANROCK" cmd /k "py server.py"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8000"
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "RIOJANROCK" cmd /k "python server.py"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8000"
  exit /b
)
echo No se encontro Python.
echo Instala Python y vuelve a ejecutar este archivo.
pause
