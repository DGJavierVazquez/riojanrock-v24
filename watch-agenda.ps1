$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$agenda = Join-Path $root 'assets\agenda'
$generator = Join-Path $root 'generate-agenda.ps1'
& powershell -NoProfile -ExecutionPolicy Bypass -File $generator
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $agenda
$watcher.Filter = '*.*'
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [IO.NotifyFilters]'FileName, LastWrite, Size'
$action = { Start-Sleep -Milliseconds 500; try { & powershell -NoProfile -ExecutionPolicy Bypass -File $using:generator | Out-Host } catch { Write-Host "No se pudo actualizar la agenda: $($_.Exception.Message)" } }
Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Deleted -Action $action | Out-Null
Register-ObjectEvent $watcher Renamed -Action $action | Out-Null
Register-ObjectEvent $watcher Changed -Action $action | Out-Null
Write-Host ''
Write-Host 'RIOJANROCK - monitor de agenda activo.'
Write-Host 'Agrega o reemplaza flyers en assets\agenda y agenda-data.js se actualizara automaticamente.'
Write-Host 'Presiona Ctrl+C para detenerlo.'
while ($true) { Wait-Event -Timeout 5 | Out-Null }
