# Deploy & CI/CD — pimentel.cloud

Guía completa para desplegar el sitio manualmente o de forma automática con GitHub Actions.

---

## Deploy manual (macOS)

Ejecuta el script desde la raíz del proyecto:

```bash
./deploy.sh
```

El script realiza automáticamente:
1. Transfiere los archivos al servidor vía rsync
2. Aplica permisos correctos (755 dirs / 644 archivos)
3. Recarga Nginx
4. Verifica que el sitio responde con HTTP 200

---

## CI/CD con GitHub Actions

Cada `git push` a la rama `main` dispara el pipeline automáticamente.

### Pipeline

```
push a main
    │
    ▼
┌─────────────┐
│  Validate   │  Verifica archivos críticos, SEO tags y tamaño de CSS
└──────┬──────┘
       │ pasa
       ▼
┌─────────────┐
│   Deploy    │  rsync → permisos → nginx reload → health check
└─────────────┘
```

### Configuración inicial (solo una vez)

#### 1. Generar clave SSH dedicada para el CI

No uses tu clave personal. Crea una exclusiva para GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
```

Esto genera dos archivos:
- `~/.ssh/github_deploy` → clave privada (va a GitHub Secrets)
- `~/.ssh/github_deploy.pub` → clave pública (va al servidor)

#### 2. Agregar la clave pública al servidor

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub raul@31.220.60.54
```

#### 3. Obtener el known_hosts del servidor

```bash
ssh-keyscan 31.220.60.54
```

Copia todo el output — lo necesitas en el paso siguiente.

#### 4. Agregar secrets en GitHub

Ve a tu repositorio → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|---|---|
| `SSH_PRIVATE_KEY` | Contenido completo de `~/.ssh/github_deploy` |
| `SSH_KNOWN_HOSTS` | Output del comando `ssh-keyscan` del paso anterior |

#### 5. Permitir nginx reload sin contraseña en el servidor

El workflow necesita recargar Nginx sin que el servidor pida contraseña de sudo:

```bash
ssh raul@31.220.60.54 "echo 'raul ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx' | sudo tee /etc/sudoers.d/nginx-reload"
```

#### 6. Permitir sudo sin contraseña en el servidor (obligatorio)

El deploy necesita recargar Nginx y escribir la config de caché sin contraseña interactiva. Ejecuta esto **una sola vez** desde tu terminal (te pedirá la contraseña de `raul` una última vez):

```bash
ssh raul@31.220.60.54 "sudo bash -c \"echo 'raul ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx, /usr/sbin/nginx -t, /usr/bin/tee /etc/nginx/conf.d/pimentel-cache.conf' > /etc/sudoers.d/raul-deploy && chmod 440 /etc/sudoers.d/raul-deploy\""
```

Verifica que funcionó:

```bash
ssh raul@31.220.60.54 "sudo systemctl reload nginx && echo OK"
# Debe responder: OK  (sin pedir contraseña)
```

#### 7. Verificar que el workflow funciona

Haz un commit cualquiera y súbelo:

```bash
git add .
git commit -m "test: verificar pipeline CI/CD"
git push origin main
```

Revisa el resultado en GitHub → **Actions** → selecciona el workflow más reciente.

---

## Solución de problemas

### El rsync falla con "Permission denied"

La clave SSH no está configurada correctamente. Verifica:

```bash
ssh -i ~/.ssh/github_deploy raul@31.220.60.54 "echo OK"
```

Si no responde `OK`, repite el paso 2.

### Nginx no recarga (error de sudo)

Verifica que el archivo de sudoers existe en el servidor:

```bash
ssh raul@31.220.60.54 "cat /etc/sudoers.d/nginx-reload"
```

Debe mostrar: `raul ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx`

### El health check falla con HTTP distinto de 200

Revisa los logs de Nginx en el servidor:

```bash
ssh raul@31.220.60.54 "sudo tail -50 /var/log/nginx/error.log"
```

### Comandos útiles en el servidor

```bash
# Ver archivos desplegados
ssh raul@31.220.60.54 "ls -la /home/raul/apps/root"

# Ver estado de Nginx
ssh raul@31.220.60.54 "sudo systemctl status nginx"

# Recargar Nginx manualmente
ssh raul@31.220.60.54 "sudo systemctl reload nginx"

# Ver logs de acceso
ssh raul@31.220.60.54 "sudo tail -f /var/log/nginx/access.log"
```

---

## Archivos del proyecto

| Archivo | Descripción |
|---|---|
| `deploy.sh` | Script de deploy manual para macOS |
| `.github/workflows/deploy.yml` | Pipeline de CI/CD con GitHub Actions |
| `DEPLOY.md` | Esta guía |
