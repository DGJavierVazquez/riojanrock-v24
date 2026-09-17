$ErrorActionPreference = 'Stop'
$agenda = Join-Path $PSScriptRoot 'assets\agenda'
$extensions = @('.jpg','.jpeg','.png','.webp','.gif')
$files = Get-ChildItem -LiteralPath $agenda -File |
  Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() -and $_.Name -notmatch '^placeholder\.' } |
  Sort-Object @{Expression={ if ($_.BaseName -match '^(\d+)') { [int]$Matches[1] } else { 999999 } }}, Name
$items = foreach ($f in $files) {
  $name = [IO.Path]::GetFileNameWithoutExtension($f.Name) -replace '^\d+[-_ ]*','' -replace '[-_]+',' '
  [ordered]@{ src=('assets/agenda/' + $f.Name); href='https://www.instagram.com/riojanrock/'; alt=($name + ' — agenda RIOJANROCK') }
}
$json = if ($items) { $items | ConvertTo-Json -Depth 3 -Compress } else { '[]' }
Set-Content -LiteralPath (Join-Path $agenda 'agenda.json') -Value $json -Encoding UTF8
Set-Content -LiteralPath (Join-Path $agenda 'agenda-data.js') -Value ('window.RR_AGENDA_DATA = ' + $json + ';') -Encoding UTF8
Write-Host "Agenda actualizada: $($files.Count) flyer(s)."
