# Matcha Trailer Runner (dispatcher). Esegue solo i job predefiniti in tools\queue (vedi worker.ps1).
$ErrorActionPreference = 'Continue'
$Tools = $PSScriptRoot
$Root = Split-Path $Tools -Parent
$Queue = Join-Path $Tools 'queue'
$Running = Join-Path $Tools 'running'
$Done = Join-Path $Tools 'done'
foreach ($d in @($Queue, $Running, $Done)) { if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null } }
$Log = Join-Path $Tools 'runner.log'
function Write-Log([string]$m) {
  $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
  Add-Content -Path $Log -Value $line -Encoding UTF8
  Write-Host $line
}
try { $Host.UI.RawUI.WindowTitle = 'Matcha Trailer Runner' } catch {}
Write-Host ''
Write-Host '  MATCHA TRAILER RUNNER' -ForegroundColor Cyan
Write-Host '  Esegue i job del trailer: clone della repo, immagini (OpenAI), voce e musica (Gemini).' -ForegroundColor Gray
Write-Host '  Lascia aperta questa finestra finche il lavoro non e finito. Per fermarla: chiudila.' -ForegroundColor Gray
Write-Host ''
Write-Log "Runner avviato. Cartella: $Root"
$MaxParallel = 4
$procs = @{}
while ($true) {
  $stopFile = Join-Path $Tools 'STOP'
  if (Test-Path $stopFile) { Write-Log 'STOP ricevuto, esco.'; Remove-Item $stopFile -Force; break }
  try { Set-Content -Path (Join-Path $Tools 'heartbeat.txt') -Value (Get-Date -Format o) -Encoding ASCII } catch {}
  foreach ($k in @($procs.Keys)) {
    if ($procs[$k].HasExited) { Write-Log "Job $k terminato"; $procs.Remove($k) }
  }
  if ($procs.Count -lt $MaxParallel) {
    $jobs = @(Get-ChildItem -Path $Queue -Filter '*.json' -ErrorAction SilentlyContinue | Sort-Object Name)
    foreach ($j in $jobs) {
      if ($procs.Count -ge $MaxParallel) { break }
      $dest = Join-Path $Running $j.Name
      try { Move-Item -LiteralPath $j.FullName -Destination $dest -Force -ErrorAction Stop } catch { continue }
      $id = [IO.Path]::GetFileNameWithoutExtension($j.Name)
      $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + (Join-Path $Tools 'worker.ps1') + '"'), '-JobFile', ('"' + $dest + '"'))
      $p = Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -WindowStyle Hidden -PassThru
      $procs[$id] = $p
      Write-Log "Avviato job $id"
    }
  }
  Start-Sleep -Milliseconds 1500
}
