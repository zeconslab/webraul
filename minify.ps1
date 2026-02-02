# Script para minificar CSS y JS sin npm
# Ejecutar en PowerShell: .\minify.ps1

Write-Host "Minificando archivos..." -ForegroundColor Green

# Minificar CSS
$css = Get-Content "css\main.css" -Raw
$cssMin = $css -replace '\s+', ' ' -replace '\s*{\s*', '{' -replace '\s*}\s*', '}' -replace '\s*:\s*', ':' -replace '\s*;\s*', ';' -replace '\s*,\s*', ',' -replace '/\*.*?\*/', '' -replace '^\s+', '' -replace '\s+$', ''
$cssMin | Set-Content "css\main.min.css" -NoNewline
Write-Host "✓ CSS minificado: css\main.min.css" -ForegroundColor Cyan

# Minificar JS (básico)
$js = Get-Content "js\main.js" -Raw
$jsMin = $js -replace '//.*$', '' -replace '/\*.*?\*/', '' -replace '\s+', ' ' -replace '\s*{\s*', '{' -replace '\s*}\s*', '}' -replace '\s*;\s*', ';' -replace '\s*,\s*', ',' -replace '\s*=\s*', '=' -replace '^\s+', '' -replace '\s+$', ''
$jsMin | Set-Content "js\main.min.js" -NoNewline
Write-Host "✓ JS minificado: js\main.min.js" -ForegroundColor Cyan

# Mostrar tamaños
$cssOriginal = (Get-Item "css\main.css").Length
$cssMinified = (Get-Item "css\main.min.css").Length
$jsOriginal = (Get-Item "js\main.js").Length
$jsMinified = (Get-Item "js\main.min.js").Length

Write-Host "`nResultados:" -ForegroundColor Yellow
Write-Host "CSS: $([math]::Round($cssOriginal/1KB, 2)) KB → $([math]::Round($cssMinified/1KB, 2)) KB ($(100 - [math]::Round(($cssMinified/$cssOriginal)*100, 1))% reducido)"
Write-Host "JS:  $([math]::Round($jsOriginal/1KB, 2)) KB → $([math]::Round($jsMinified/1KB, 2)) KB ($(100 - [math]::Round(($jsMinified/$jsOriginal)*100, 1))% reducido)"
Write-Host "`n¡Listo! Ahora sube los archivos .min a tu servidor" -ForegroundColor Green
