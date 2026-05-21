#!/bin/bash
# ============================================================
# deploy.sh — Build + Deploy a pimentel.cloud
# Uso: ./deploy.sh
# ============================================================

SERVER="raul@31.220.60.54"
REMOTE_PATH="/home/raul/apps/root"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)"
SITE_URL="https://pimentel.cloud"

# Colores
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m'

step() { echo -e "\n${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      Deploy Web — pimentel.cloud     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo -e "  Servidor:  ${WHITE}${SERVER}${NC}"
echo -e "  Ruta:      ${WHITE}${REMOTE_PATH}${NC}"
echo ""

# Verificar dependencias
for cmd in rsync ssh curl node; do
    if ! command -v $cmd &> /dev/null; then
        fail "$cmd no está instalado."
    fi
done

# Confirmar
echo -e "${YELLOW}  Esta acción compilará y desplegará el sitio en producción.${NC}"
read -rp "  ¿Continuar? (s/n): " confirm
[[ "$confirm" != "s" && "$confirm" != "S" ]] && { echo -e "${RED}  Cancelado.${NC}"; exit 0; }

# ── 1. Build Tailwind CSS ──────────────────────────────────
step "Compilando Tailwind CSS..."
"${LOCAL_PATH}/node_modules/.bin/tailwindcss" \
    -c "${LOCAL_PATH}/tailwind.config.js" \
    -i "${LOCAL_PATH}/src/input.css" \
    -o "${LOCAL_PATH}/css/tailwind.css" \
    --minify 2>/dev/null
ok "tailwind.css generado ($(wc -c < "${LOCAL_PATH}/css/tailwind.css" | tr -d ' ') bytes)"

# ── 2. Minificar main.css ──────────────────────────────────
step "Minificando CSS..."
if command -v node &> /dev/null; then
    node -e "
        const fs = require('fs');
        let css = fs.readFileSync('${LOCAL_PATH}/css/main.css', 'utf8');
        css = css
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s*([{}:;,>~+])\s*/g, '\$1')
            .replace(/\s+/g, ' ')
            .replace(/;\}/g, '}')
            .trim();
        fs.writeFileSync('${LOCAL_PATH}/css/main.min.css', css);
    " 2>/dev/null
    ok "main.min.css generado ($(wc -c < "${LOCAL_PATH}/css/main.min.css" | tr -d ' ') bytes)"
else
    cp "${LOCAL_PATH}/css/main.css" "${LOCAL_PATH}/css/main.min.css"
    ok "main.min.css copiado (sin minificar)"
fi

# ── 3. Minificar main.js ───────────────────────────────────
step "Minificando JavaScript..."
if [ -f "${LOCAL_PATH}/node_modules/.bin/terser" ]; then
    "${LOCAL_PATH}/node_modules/.bin/terser" \
        "${LOCAL_PATH}/js/main.js" \
        --compress --mangle \
        -o "${LOCAL_PATH}/js/main.min.js" 2>/dev/null
    ok "main.min.js generado ($(wc -c < "${LOCAL_PATH}/js/main.min.js" | tr -d ' ') bytes)"
else
    cp "${LOCAL_PATH}/js/main.js" "${LOCAL_PATH}/js/main.min.js"
    ok "main.min.js copiado (terser no instalado, instala con: npm i -D terser)"
fi

# ── 4. Cache-busting: inyectar versión en index.html ──────
step "Generando index.html con cache-busting..."
BUILD_VER=$(git -C "${LOCAL_PATH}" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)
VERSIONED_HTML="${LOCAL_PATH}/_index.html"
sed \
    -e "s|href=\"css/tailwind\.css\"|href=\"css/tailwind.css?v=${BUILD_VER}\"|g" \
    -e "s|href=\"css/main\.css\"|href=\"css/main.css?v=${BUILD_VER}\"|g" \
    -e "s|href=\"css/tailwind\.css\" as=\"style\"|href=\"css/tailwind.css?v=${BUILD_VER}\" as=\"style\"|g" \
    -e "s|href=\"css/main\.css\" as=\"style\"|href=\"css/main.css?v=${BUILD_VER}\" as=\"style\"|g" \
    -e "s|src=\"js/main\.js\"|src=\"js/main.js?v=${BUILD_VER}\"|g" \
    "${LOCAL_PATH}/index.html" > "${VERSIONED_HTML}"
ok "Versión: ${BUILD_VER}"

# ── 5. Transferir archivos ─────────────────────────────────
step "Transfiriendo archivos..."
rsync -az --progress \
    --exclude='*.ps1' \
    --exclude='*.sh' \
    --exclude='.git' \
    --exclude='.gitignore' \
    --exclude='*.md' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    --exclude='.claude' \
    --exclude='src/' \
    --exclude='tailwind.config.js' \
    --exclude='package*.json' \
    --exclude='css/main.css' \
    --exclude='js/main.js' \
    --exclude='nginx-cache.conf' \
    --exclude='index.html' \
    --exclude='.github' \
    "${LOCAL_PATH}/" \
    "${SERVER}:${REMOTE_PATH}/"
[ $? -eq 0 ] && ok "Archivos transferidos" || fail "Error en la transferencia."

# Subir index.html versionado y renombrar minificados
ssh "${SERVER}" "
    mv ${REMOTE_PATH}/_index.html ${REMOTE_PATH}/index.html;
    [ -f ${REMOTE_PATH}/css/main.min.css ] && mv ${REMOTE_PATH}/css/main.min.css ${REMOTE_PATH}/css/main.css;
    [ -f ${REMOTE_PATH}/js/main.min.js ]  && mv ${REMOTE_PATH}/js/main.min.js  ${REMOTE_PATH}/js/main.js;
"
rm -f "${VERSIONED_HTML}"

# ── 5. Permisos ────────────────────────────────────────────
step "Aplicando permisos..."
ssh "${SERVER}" "
    chmod -R 755 ${REMOTE_PATH} &&
    find ${REMOTE_PATH} -type f -exec chmod 644 {} \;
" && ok "Permisos aplicados (755 dirs / 644 archivos)" || fail "Error al aplicar permisos."

# ── 6a. Caché estático Nginx (idempotente) ─────────────────
# Estrategia: snippet file separado — siempre sobreescrito con los valores actuales.
# El include se añade al server block una sola vez. Sin guard de skip.
step "Configurando caché estático en Nginx..."
ssh "${SERVER}" bash << 'SSH_CACHE_CONF'
CONF="/etc/nginx/sites-enabled/pimentel.cloud"
SNIPPET="/etc/nginx/snippets/pimentel-static-cache.conf"

# 1. Crear/sobreescribir snippet (siempre actualizado en cada deploy)
sudo mkdir -p "$(dirname "$SNIPPET")"
sudo tee "$SNIPPET" > /dev/null << 'NGINX_CACHE'
# pimentel-static-cache — regenerado por deploy.sh
location ~* \.(css|js)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Vary Accept-Encoding;
}
location ~* \.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
NGINX_CACHE

# 2. Limpiar bloque inline viejo si existe (puede tener TTL corto y tomar precedencia)
if grep -q "cache-static-assets" "$CONF" 2>/dev/null; then
    BKUP="$CONF.bak.$(date +%s)"
    sudo cp "$CONF" "$BKUP"
    sudo awk '
    /# cache-static-assets/ { skip=1; next }
    skip && /^[[:space:]]+(location|expires|add_header|[{}])/ { next }
    skip && /^[[:space:]]*$/ { next }
    skip { skip=0 }
    { print }
    ' "$CONF" | sudo tee /tmp/pimentel-nginx.tmp > /dev/null
    sudo cp /tmp/pimentel-nginx.tmp "$CONF"
fi

# 3. Insertar include en el server block (solo si no está aún)
if ! grep -q "pimentel-static-cache" "$CONF" 2>/dev/null; then
    [ -n "${BKUP:-}" ] || { BKUP="$CONF.bak.$(date +%s)"; sudo cp "$CONF" "$BKUP"; }
    sudo awk '
    /^}/ { last = NR }
    { line[NR] = $0 }
    END {
        for (i = 1; i <= NR; i++) {
            if (i == last) print "    include snippets/pimentel-static-cache.conf;"
            print line[i]
        }
    }' "$CONF" | sudo tee /tmp/pimentel-nginx.tmp > /dev/null
    sudo cp /tmp/pimentel-nginx.tmp "$CONF"
fi

sudo nginx -t || { [ -n "${BKUP:-}" ] && sudo cp "$BKUP" "$CONF" && echo "BACKUP RESTORED"; exit 1; }
SSH_CACHE_CONF
[ $? -eq 0 ] && ok "Nginx cache configurado (1y + immutable)" || fail "Error al configurar caché Nginx."

# ── 6b. Recargar Nginx ─────────────────────────────────────
step "Recargando Nginx..."
ssh "${SERVER}" "sudo systemctl reload nginx" \
    && ok "Nginx recargado" \
    || fail "Error al recargar Nginx."

# ── 8. Health check ───────────────────────────────────────
step "Verificando sitio en producción..."
sleep 2
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" --max-time 10 "${SITE_URL}")
[ "$HTTP_CODE" = "200" ] && ok "Sitio responde correctamente (HTTP ${HTTP_CODE})" || fail "Sitio respondió HTTP ${HTTP_CODE}."

# ── Resumen ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Deploy exitoso ✓               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo -e "  ${CYAN}${SITE_URL}${NC}"
echo ""
