# Deployment Guide

## Self-hosted — Docker Compose

### Prerequisites on your server
```bash
# Install Docker + Docker Compose (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # then re-login
```

### First deploy
```bash
# On your server — clone the repo
git clone https://github.com/jawahirps/autoapply-ae.git
cd autoapply-ae

# Build and start (runs on port 80)
docker compose up -d --build
```

App is now live at `http://<your-server-ip>`.

### Update after a code change
```bash
git pull
docker compose up -d --build
```

### View logs
```bash
docker compose logs -f
```

### Stop
```bash
docker compose down
```

### Data persistence
Resume uploads and the SQLite database are stored in a Docker volume (`app_data`).
They survive container restarts and rebuilds.

---

## HTTPS (optional but recommended)

Install Caddy on your server for automatic HTTPS:

```bash
sudo apt install -y caddy
```

Edit `/etc/caddy/Caddyfile`:
```
yourdomain.com {
    reverse_proxy localhost:80
}
```

```bash
sudo systemctl reload caddy
```

Caddy auto-issues a Let's Encrypt certificate.

---

## Quick public URL (dev / testing only)

Expose your local dev server instantly via Cloudflare Tunnel:
```bash
cloudflared tunnel --url http://localhost:5173
```
