#!/usr/bin/env bash
set -euo pipefail

SERVER="raul@31.220.60.54"
REMOTE_PATH="/home/raul/apps/webraul"
PROJECT_PATH="$(cd "$(dirname "$0")" && pwd)"
PUBLISH_PATH="${PROJECT_PATH}/publish"

read -r -p "Publicar pimentel.cloud en producción? (s/n): " answer
[[ "$answer" == "s" || "$answer" == "S" ]] || exit 0

dotnet publish "${PROJECT_PATH}/webraul.csproj" --configuration Release --output "${PUBLISH_PATH}"
rsync -az --delete --exclude='wwwroot/uploads/' "${PUBLISH_PATH}/" "${SERVER}:${REMOTE_PATH}/"
ssh "${SERVER}" "sudo systemctl restart webraul"

status="$(curl -o /dev/null -s -w '%{http_code}' --max-time 20 https://pimentel.cloud)"
[[ "$status" == "200" ]] || { echo "Health check falló: HTTP ${status}"; exit 1; }
echo "Deploy completado: https://pimentel.cloud"
