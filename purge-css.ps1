# Script para eliminar CSS no utilizado y minificar
# Ejecutar: .\purge-css.ps1

Write-Host "=== Limpieza y Minificación de CSS ===" -ForegroundColor Cyan

# Verificar si Node.js está instalado
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js no está instalado. Descárgalo de: https://nodejs.org/" -ForegroundColor Red
    Write-Host "`n💡 Alternativa: Usa herramientas online:" -ForegroundColor Yellow
    Write-Host "   - https://purifycss.online/" -ForegroundColor White
    Write-Host "   - https://puurgr.com/" -ForegroundColor White
    exit 1
}

Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green

# Instalar PurgeCSS si no está instalado
Write-Host "`nInstalando PurgeCSS..." -ForegroundColor Yellow
npm install -g purgecss 2>$null

# Ejecutar PurgeCSS
Write-Host "`nAnalizando archivos y eliminando CSS no utilizado..." -ForegroundColor Yellow
purgecss --css css/main.css --content index.html js/main.js --output css/

# Renombrar archivo limpiado
if (Test-Path "css/main.css") {
    Move-Item -Path "css/main.css" -Destination "css/main.clean.css" -Force
    Write-Host "✓ CSS limpiado guardado en: css/main.clean.css" -ForegroundColor Green
}

# Minificar el CSS limpio
Write-Host "`nMinificando CSS..." -ForegroundColor Yellow
$css = Get-Content "css/main.clean.css" -Raw
$cssMin = $css -replace '\s+', ' ' -replace '\s*{\s*', '{' -replace '\s*}\s*', '}' -replace '\s*:\s*', ':' -replace '\s*;\s*', ';' -replace '\s*,\s*', ',' -replace '/\*.*?\*/', '' -replace '^\s+', '' -replace '\s+$', ''
$cssMin | Set-Content "css/main.min.css" -NoNewline

# Mostrar resultados
$originalSize = (Get-Item "css/main.css").Length / 1KB
$cleanSize = (Get-Item "css/main.clean.css").Length / 1KB
$minSize = (Get-Item "css/main.min.css").Length / 1KB

Write-Host "`n📊 Resultados:" -ForegroundColor Cyan
Write-Host "   Original:  $([math]::Round($originalSize, 2)) KB" -ForegroundColor White
Write-Host "   Limpiado:  $([math]::Round($cleanSize, 2)) KB ($([math]::Round((1-$cleanSize/$originalSize)*100, 1))% reducido)" -ForegroundColor Green
Write-Host "   Minified:  $([math]::Round($minSize, 2)) KB ($([math]::Round((1-$minSize/$originalSize)*100, 1))% reducido)" -ForegroundColor Green

Write-Host "`n✅ ¡Completado! Archivos generados:" -ForegroundColor Green
Write-Host "   - css/main.clean.css (legible, sin CSS no usado)" -ForegroundColor White
Write-Host "   - css/main.min.css (minificado para producción)" -ForegroundColor White
Write-Host "`n💾 Sube css/main.min.css a tu servidor" -ForegroundColor Yellow
