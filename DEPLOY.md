# Deployment Guide

## Current public URL (Cloudflare Tunnel — active while laptop is on)
https://lamb-contents-stationery-cache.trycloudflare.com

To restart tunnel after reboot:
```bash
cloudflared tunnel --url http://localhost:8000
```

---

## Permanent deployment — Railway

### One-time setup
1. `railway login`          # opens browser auth
2. `railway init`           # creates new Railway project
3. `railway up`             # builds Docker image and deploys
4. `railway domain`         # assigns a permanent *.railway.app URL

### Re-deploy after changes
```bash
git add -A && git commit -m "update"
railway up
```

### Environment variables to set in Railway dashboard
| Variable | Value |
|---|---|
| `RAILWAY_ENVIRONMENT` | `production` |
| `PORT` | `8000` (set automatically) |
| `DATA_DIR` | `/app/data` |
| `UPLOAD_DIR` | `/app/uploads` |

> Note: For persistent file storage on Railway, add a Volume mounted at `/app/data`.
