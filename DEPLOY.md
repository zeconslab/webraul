# pimentel.cloud — ASP.NET Core 9 + SQL Server

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

Instala el runtime ASP.NET Core 9 y crea las rutas:

```bash
sudo mkdir -p /home/raul/apps/webraul /etc/webraul
sudo chown -R raul:raul /home/raul/apps/webraul
sudo chmod 750 /etc/webraul
```

Copia `deploy/linux/webraul.env.example` a `/etc/webraul/webraul.env`, completa la conexión real y protege el archivo:

```bash
sudo chmod 600 /etc/webraul/webraul.env
sudo cp deploy/linux/webraul.service /etc/systemd/system/webraul.service
sudo systemctl daemon-reload
sudo systemctl enable webraul
```

Instala `deploy/linux/nginx.conf` como virtual host de Nginx, valida y recarga:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Publicación manual

```bash
dotnet publish -c Release -o publish
rsync -az --delete --exclude='uploads/' publish/ raul@31.220.60.54:/home/raul/apps/webraul/
ssh raul@31.220.60.54 "sudo systemctl restart webraul"
```

La carpeta `wwwroot/uploads` debe conservarse entre despliegues y contar con permisos de escritura para el usuario `raul`.

## CI/CD

El workflow de GitHub compila, publica, sincroniza y reinicia el servicio. Requiere:

- `SSH_PRIVATE_KEY`
- `SSH_KNOWN_HOSTS`
- permiso `sudo systemctl restart webraul` sin contraseña para el usuario de despliegue

La cadena SQL y las credenciales administrativas viven únicamente en `/etc/webraul/webraul.env`, no en GitHub Actions.
