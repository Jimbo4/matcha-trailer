# Matcha Trailer Runner (worker). Tipi di job ammessi: ping, git_clone (solo la repo Matcha), git_publish (solo la cartella trailer verso github.com/Jimbo4), http (solo host in allowlist).
param([string]$JobFile)
$ErrorActionPreference = 'Stop'
$Tools = $PSScriptRoot
$Root = Split-Path $Tools -Parent
$ProjectRoot = Split-Path $Root -Parent
$Done = Join-Path $Tools 'done'
$id = [IO.Path]::GetFileNameWithoutExtension($JobFile)
$result = [ordered]@{ id = $id; status = 'error'; started = (Get-Date -Format o) }
$sw = [Diagnostics.Stopwatch]::StartNew()
$AllowedHosts = @('api.openai.com', 'generativelanguage.googleapis.com', 'cdn.pixabay.com', 'pixabay.com', 'assets.mixkit.co', 'mixkit.co', 'raw.githubusercontent.com')
$AllowedRepo = 'https://github.com/anotherbuginthecode/matcha-codebase.git'

function Get-Keys {
  $keys = @{}
  $envFile = Join-Path $Root '_keys.env'
  if (Test-Path $envFile) {
    foreach ($line in (Get-Content $envFile -Encoding UTF8)) {
      if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') { $keys[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'") }
    }
  }
  return $keys
}
function Test-Inside([string]$full, [string[]]$roots) {
  foreach ($r in $roots) { $rr = [IO.Path]::GetFullPath($r).TrimEnd('\') + '\'; if ($full.StartsWith($rr, [StringComparison]::OrdinalIgnoreCase)) { return $true } }
  return $false
}
function Resolve-Out([string]$rel) {
  $full = [IO.Path]::GetFullPath((Join-Path $Root $rel))
  if (-not (Test-Inside $full @($Root))) { throw "Percorso di output non consentito: $rel" }
  $dir = Split-Path $full -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  return $full
}
function Resolve-In([string]$rel) {
  $full = [IO.Path]::GetFullPath((Join-Path $Root $rel))
  if (-not (Test-Inside $full @($ProjectRoot))) { throw "Percorso di input non consentito: $rel" }
  return $full
}

try {
  $job = Get-Content -LiteralPath $JobFile -Raw -Encoding UTF8 | ConvertFrom-Json
  $result.type = $job.type
  switch ($job.type) {
    'ping' {
      $k = Get-Keys
      $result.psversion = $PSVersionTable.PSVersion.ToString()
      $g = Get-Command git -ErrorAction SilentlyContinue; if ($g) { $result.git = $g.Source }
      $n = Get-Command node -ErrorAction SilentlyContinue; if ($n) { $result.node = $n.Source }
      $py = Get-Command python -ErrorAction SilentlyContinue; if ($py) { $result.python = $py.Source }
      $result.keys = @{ openai = [bool]$k['OPENAI_API_KEY']; gemini = [bool]$k['GEMINI_API_KEY'] }
      $result.status = 'ok'
    }
    'git_clone' {
      if ($job.repo -ne $AllowedRepo) { throw 'Repo non consentita' }
      $dest = Join-Path $ProjectRoot 'matcha-codebase'
      $logOut = Join-Path $Done "$id.git.out.txt"
      $logErr = Join-Path $Done "$id.git.err.txt"
      if (Test-Path (Join-Path $dest '.git')) { $gitArgs = @('-C', ('"' + $dest + '"'), 'pull', '--ff-only') }
      else { $gitArgs = @('clone', $AllowedRepo, ('"' + $dest + '"')) }
      $p = Start-Process -FilePath 'git' -ArgumentList $gitArgs -Wait -PassThru -WindowStyle Hidden -RedirectStandardOutput $logOut -RedirectStandardError $logErr
      $result.exit = $p.ExitCode
      $result.log = ((Get-Content $logOut -Raw -ErrorAction SilentlyContinue) + "`n" + (Get-Content $logErr -Raw -ErrorAction SilentlyContinue))
      if ($p.ExitCode -eq 0) { $result.status = 'ok' } else { $result.status = 'error' }
    }
    'git_publish' {
      # Pubblica la cartella trailer su una repo GitHub di Jimbo4 con le credenziali Git gia presenti sul PC:
      # init (se serve), add, commit, remote, push. Non legge ne scrive credenziali.
      $remote = [string]$job.remote
      if ($remote -notmatch '^https://github\.com/Jimbo4/[A-Za-z0-9._-]+\.git$') { throw "Remote non consentito: $remote" }
      $msg = [string]$job.message; if (-not $msg) { $msg = 'Aggiornamento trailer' }
      $env:GIT_TERMINAL_PROMPT = '0'
      $script:gitlog = ''
      function Run-Git([string]$argLine, [string]$tag) {
        $o = Join-Path $Done "$id.$tag.out.txt"; $e = Join-Path $Done "$id.$tag.err.txt"
        $p = Start-Process -FilePath 'git' -ArgumentList $argLine -WorkingDirectory $Root -Wait -PassThru -WindowStyle Hidden -RedirectStandardOutput $o -RedirectStandardError $e
        $txt = (Get-Content $o -Raw -ErrorAction SilentlyContinue) + (Get-Content $e -Raw -ErrorAction SilentlyContinue)
        $script:gitlog += "`n> git $argLine (exit $($p.ExitCode))`n$txt"
        return $p.ExitCode
      }
      if (!(Test-Path (Join-Path $Root '.git'))) {
        if ((Run-Git 'init' 'init') -ne 0) { throw 'git init fallito' }
        [void](Run-Git 'symbolic-ref HEAD refs/heads/main' 'branch')
      }
      $ident = ''
      if ((Run-Git 'config user.email' 'ident') -ne 0) { $ident = '-c user.name="Jacopo Marcolini" -c user.email="Jimbo4@users.noreply.github.com" ' }
      if ((Run-Git 'add -A' 'add') -ne 0) { throw 'git add fallito' }
      $msgFile = Join-Path $Done "$id.msg.txt"
      [IO.File]::WriteAllText($msgFile, $msg, (New-Object Text.UTF8Encoding($false)))
      $c = Run-Git ($ident + 'commit -F "' + $msgFile + '"') 'commit'
      $result.committed = ($c -eq 0)
      if ((Run-Git 'remote get-url origin' 'remote') -ne 0) { [void](Run-Git ('remote add origin ' + $remote) 'remote_add') }
      else { [void](Run-Git ('remote set-url origin ' + $remote) 'remote_set') }
      $pushExit = Run-Git '-c http.postBuffer=524288000 push -u origin main' 'push'
      [void](Run-Git 'log --oneline -1' 'head')
      $result.exit = $pushExit
      $result.log = $script:gitlog.Substring([Math]::Max(0, $script:gitlog.Length - 6000))
      if ($pushExit -eq 0) { $result.status = 'ok' } else { $result.status = 'error'; $result.error = 'git push fallito (vedi log)' }
    }
    'http' {
      Add-Type -AssemblyName System.Net.Http
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      $uri = [Uri]$job.url
      if ($AllowedHosts -notcontains $uri.Host) { throw "Host non consentito: $($uri.Host)" }
      $keys = Get-Keys
      $handler = New-Object System.Net.Http.HttpClientHandler
      $handler.AllowAutoRedirect = $true
      $client = New-Object System.Net.Http.HttpClient($handler)
      $timeout = 600; if ($job.timeout) { $timeout = [int]$job.timeout }
      $client.Timeout = [TimeSpan]::FromSeconds($timeout)
      $method = 'GET'; if ($job.method) { $method = ([string]$job.method).ToUpper() }
      $req = New-Object System.Net.Http.HttpRequestMessage((New-Object System.Net.Http.HttpMethod($method)), $uri)
      [void]$req.Headers.TryAddWithoutValidation('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MatchaTrailerRunner/1.0')
      if ($job.headers) {
        foreach ($prop in $job.headers.PSObject.Properties) {
          $val = [string]$prop.Value
          foreach ($kk in $keys.Keys) { $val = $val.Replace('{{' + $kk + '}}', $keys[$kk]) }
          if ($val -match '\{\{') { throw "Chiave mancante in _keys.env per l'header $($prop.Name)" }
          [void]$req.Headers.TryAddWithoutValidation($prop.Name, $val)
        }
      }
      if ($job.body_file) {
        $bytes = [IO.File]::ReadAllBytes((Resolve-In $job.body_file))
        $content = New-Object System.Net.Http.ByteArrayContent(, $bytes)
        $ct = 'application/json'; if ($job.content_type) { $ct = $job.content_type }
        $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse($ct)
        $req.Content = $content
      } elseif ($job.multipart) {
        $mp = New-Object System.Net.Http.MultipartFormDataContent
        foreach ($part in $job.multipart) {
          if ($part.file) {
            $fp = Resolve-In $part.file
            $fbytes = [IO.File]::ReadAllBytes($fp)
            $fc = New-Object System.Net.Http.ByteArrayContent(, $fbytes)
            $pct = 'application/octet-stream'; if ($part.content_type) { $pct = $part.content_type }
            $fc.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse($pct)
            $fname = [IO.Path]::GetFileName($fp); if ($part.filename) { $fname = $part.filename }
            $mp.Add($fc, $part.name, $fname)
          } else {
            $sc = New-Object System.Net.Http.StringContent([string]$part.value, [Text.Encoding]::UTF8)
            $sc.Headers.ContentType = $null
            $mp.Add($sc, $part.name)
          }
        }
        $req.Content = $mp
      }
      $resp = $client.SendAsync($req).GetAwaiter().GetResult()
      $result.http_status = [int]$resp.StatusCode
      if ($resp.Content.Headers.ContentType) { $result.content_type = $resp.Content.Headers.ContentType.ToString() }
      $data = $resp.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
      $outPath = Resolve-Out $job.out
      [IO.File]::WriteAllBytes($outPath, $data)
      $result.out = $job.out
      $result.bytes = $data.Length
      if ($resp.IsSuccessStatusCode) { $result.status = 'ok' }
      else { $result.status = 'http_error'; $result.error = [Text.Encoding]::UTF8.GetString($data, 0, [Math]::Min($data.Length, 3000)) }
    }
    default { throw "Tipo di job sconosciuto: $($job.type)" }
  }
} catch {
  $result.status = 'error'
  $result.error = $_.Exception.Message
  if ($_.Exception.InnerException) { $result.inner = $_.Exception.InnerException.Message }
}
$result.elapsed_s = [Math]::Round($sw.Elapsed.TotalSeconds, 1)
$result.finished = (Get-Date -Format o)
($result | ConvertTo-Json -Depth 6) | Set-Content -Path (Join-Path $Done "$id.result.json") -Encoding UTF8
Remove-Item -LiteralPath $JobFile -Force -ErrorAction SilentlyContinue
