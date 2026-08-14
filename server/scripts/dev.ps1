# CivicSetu — clean dev server startup (Windows)
# Usage: npm run dev:clean

$port = 5000
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connections) {
  $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) {
    Write-Host "Stopping process $procId on port $port..."
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 1
}

Write-Host "Starting CivicSetu API on http://localhost:$port ..."
npm run dev
