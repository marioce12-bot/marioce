$port = 3000
$url = "http://localhost:$port"

Start-Process $url

if (Get-Command npm.cmd -ErrorAction SilentlyContinue) {
  npm.cmd run dev
  exit $LASTEXITCODE
}

Write-Error "npm est requis pour lancer le serveur Next.js. Installez Node.js puis lancez npm install."
exit 1
