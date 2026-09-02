# pimentel.cloud — ASP.NET Core 10 + SQL Server

Aplicación monolítica: sitio público, panel administrativo, autenticación y persistencia SQL Server en un solo proyecto.

## Desarrollo

No guardes contraseñas reales en `appsettings.json`. Configura secretos locales:

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=HOST,1433;Database=WebRaul;User Id=USUARIO;Password=PASSWORD;Encrypt=True;TrustServerCertificate=True"
dotnet user-secrets set "Admin:Email" "admin@pimentel.cloud"
dotnet user-secrets set "Admin:InitialPassword" "UNA_CONTRASEÑA_SEGURA"
dotnet run
```

En el primer arranque se aplican las migraciones, se carga el contenido inicial y se crea el administrador si las variables `Admin` tienen valor. Después de crear el usuario se puede retirar `Admin__InitialPassword` del entorno.

- Sitio público: `https://localhost:PORT/`
- Administración: `https://localhost:PORT/admin/login`

## Preparar Linux

Servidor de referencia: Ubuntu 24.04, usuario `raul`, todo vive bajo `/home/raul/apps/root`.

Instala el runtime de ASP.NET Core 10 (el repo de paquetes de Microsoft ya debe estar agregado; si no, sigue https://learn.microsoft.com/dotnet/core/install/linux-ubuntu):

```bash
sudo apt-get update
sudo apt-get install -y aspnetcore-runtime-10.0
```

Crea las rutas:

```bash
sudo mkdir -p /home/raul/apps/root /etc/webraul
sudo chown -R raul:raul /home/raul/apps/root
sudo chmod 750 /etc/webraul
```

Copia `deploy/linux/webraul.env.example` a `/etc/webraul/webraul.env`, completa la conexión real y protege el archivo:

```bash
sudo chmod 600 /etc/webraul/webraul.env
sudo cp deploy/linux/webraul.service /etc/systemd/system/webraul.service
sudo systemctl daemon-reload
sudo systemctl enable webraul
```

Instala `deploy/linux/nginx.conf` como virtual host de Nginx (reverse proxy hacia `127.0.0.1:5080`, con los bloques de Certbot ya incluidos), valida y recarga:

```bash
sudo cp deploy/linux/nginx.conf /etc/nginx/sites-available/pimentel.cloud
sudo nginx -t
sudo systemctl reload nginx
```

## Publicación manual

```bash
dotnet publish -c Release -o publish
rsync -az --delete --exclude='uploads/' publish/ raul@31.220.60.54:/home/raul/apps/root/
ssh raul@31.220.60.54 "sudo systemctl restart webraul"
```

O simplemente `./deploy.sh` desde la raíz del proyecto, que hace lo mismo con confirmación interactiva.

La carpeta `wwwroot/uploads` debe conservarse entre despliegues y contar con permisos de escritura para el usuario `raul`.

## CI/CD

El workflow de GitHub (`.github/workflows/deploy.yml`) compila con .NET 10, publica, sincroniza a `/home/raul/apps/root/` y reinicia el servicio. Requiere estos secrets:

- `SSH_PRIVATE_KEY`
- `SSH_KNOWN_HOSTS`

Y en el servidor, que el usuario de despliegue tenga permiso para reiniciar el servicio **sin contraseña** (hoy el sudoers de `raul` solo tiene `NOPASSWD` para `nginx -t`, `systemctl reload nginx` y `tee` — falta agregar `systemctl restart webraul`, si no el paso de deploy se queda esperando una contraseña que nunca llega por SSH no interactivo):

```bash
# en el servidor, con visudo o un archivo en /etc/sudoers.d/
raul ALL=(ALL) NOPASSWD: /bin/systemctl restart webraul, /bin/systemctl status webraul
```

La cadena SQL y las credenciales administrativas viven únicamente en `/etc/webraul/webraul.env`, no en GitHub Actions.
