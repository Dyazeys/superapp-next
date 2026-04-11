# Live Operations Cheat Sheet (SuperApp Next)

## Ringkasan Environment Live

- Domain: `https://app.ridersinc.id`
- App path (VPS): `/opt/superapp-next`
- Container name: `superapp-next-app`
- App port (internal host): `3000`
- Nginx vhost config: `/etc/nginx/sites-available/app.ridersinc.id.conf`
- Nginx enabled symlink: `/etc/nginx/sites-enabled/app.ridersinc.id.conf`

## Command Operasional Penting

Jalankan dari VPS:

```bash
ssh opsadmin@217.15.162.20
cd /opt/superapp-next
```

### 1) Start app

```bash
sudo docker compose up -d app
```

### 2) Stop app

```bash
sudo docker compose stop app
```

### 3) Restart app

```bash
sudo docker compose restart app
```

### 4) Cek log app

```bash
sudo docker logs -f superapp-next-app
```

Alternatif:

```bash
sudo docker compose logs -f app
```

### 5) Pull update terbaru + deploy

```bash
cd /opt/superapp-next
git fetch origin main
git checkout main
git pull --ff-only origin main
sudo docker compose build --no-cache app
sudo docker compose up -d app
sudo docker compose ps
```

## Cek Kesehatan Cepat

```bash
curl -I https://app.ridersinc.id/dashboard
curl -I https://app.ridersinc.id/products
curl -I https://app.ridersinc.id/sales
curl -I https://app.ridersinc.id/payout
curl -I https://app.ridersinc.id/payout/reconciliation
```

## Operasional Nginx/SSL (jika perlu)

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certificates
```
