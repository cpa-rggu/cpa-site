# Простой локальный сервер для просмотра сайта без Node и Python.
# Запуск (из папки site):  powershell -ExecutionPolicy Bypass -File tools\serve.ps1
# Затем откройте в браузере http://localhost:8080/
param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [int]$Port = 8080
)

$Root = (Resolve-Path $Root).Path
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.yml' = 'text/yaml; charset=utf-8'; '.yaml' = 'text/yaml; charset=utf-8'
  '.md' = 'text/markdown; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.pdf' = 'application/pdf'; '.ico' = 'image/x-icon'; '.txt' = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Сервер запущен: http://localhost:$Port/  (папка: $Root). Остановить: Ctrl+C"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      $path = Join-Path $Root $rel
      if (Test-Path $path -PathType Container) { $path = Join-Path $path 'index.html' }
      $full = [IO.Path]::GetFullPath($path)
      if ($full.StartsWith($Root) -and (Test-Path $full -PathType Leaf)) {
        $ext = [IO.Path]::GetExtension($full).ToLower()
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $bytes = [IO.File]::ReadAllBytes($full)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
        $bytes = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch {
      $res.StatusCode = 500
    } finally {
      $res.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
}
