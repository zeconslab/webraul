# Script para subir la pagina web completa al servidor
# Ejecutar: .\deploy.ps1

$SERVER = "raul@31.220.60.54"
$REMOTE_PATH = "/home/raul/apps/root"
$LOCAL_PATH = "C:\Users\gmfor\Documents\GitHub\webraul"

Write-Host "=== Deploy Web a Servidor SSH ===" -ForegroundColor Cyan
Write-Host "Servidor: $SERVER" -ForegroundColor White
Write-Host "Ruta remota: $REMOTE_PATH" -ForegroundColor White
Write-Host ""

# Verificar que SCP esta disponible
$scpCheck = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scpCheck) {
    Write-Host "SCP no esta instalado. Instala OpenSSH desde:" -ForegroundColor Red
    Write-Host "Settings > Apps > Optional Features > OpenSSH Client" -ForegroundColor Yellow
    exit 1
}

Write-Host "Preparando archivos..." -ForegroundColor Yellow

# Lista de archivos/carpetas a subir
$items = @(
    "index.html",
    "manifest.json",
    "robots.txt",
    "sitemap.xml",
    "css",
    "js",
    "assets"
)

Write-Host "Archivos preparados" -ForegroundColor Green
Write-Host ""

# Confirmar antes de subir
Write-Host "Esta accion sobrescribira los archivos en el servidor." -ForegroundColor Yellow
$confirm = Read-Host "Continuar? (s/n)"
if ($confirm -ne "s") {
    Write-Host "Cancelado por el usuario" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Iniciando transferencia..." -ForegroundColor Cyan

# Subir cada archivo/carpeta
foreach ($item in $items) {
    $sourcePath = Join-Path $LOCAL_PATH $item
    
    if (Test-Path $sourcePath) {
        Write-Host "Subiendo: $item..." -ForegroundColor White
        
        if (Test-Path $sourcePath -PathType Container) {
            # Es una carpeta - usar scp recursivo
            scp -r "$sourcePath" "${SERVER}:${REMOTE_PATH}/"
        } else {
            # Es un archivo
            scp "$sourcePath" "${SERVER}:${REMOTE_PATH}/"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: $item subido correctamente" -ForegroundColor Green
        } else {
            Write-Host "ERROR al subir $item" -ForegroundColor Red
        }
    } else {
        Write-Host "AVISO: $item no encontrado, omitiendo..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Deploy completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Tu sitio deberia estar disponible en: https://pimentel.cloud" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos utiles:" -ForegroundColor Yellow
Write-Host "Ver archivos: ssh $SERVER 'ls -la $REMOTE_PATH'" -ForegroundColor White
Write-Host "Reiniciar Nginx: ssh $SERVER 'sudo systemctl reload nginx'" -ForegroundColor White
