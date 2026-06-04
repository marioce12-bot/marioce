$port = 5500
$url = "http://localhost:$port/index.html"

Start-Process $url

if (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server $port
  exit $LASTEXITCODE
}

if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $port
  exit $LASTEXITCODE
}

Write-Error "Python est requis pour lancer le serveur local. Installez Python ou ouvrez ce dossier avec une extension de serveur local."
exit 1
