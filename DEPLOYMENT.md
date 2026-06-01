# WUST Algo Frontend Deployment

This repository contains the Vue/Vite frontend deployment files for WUST Algo.

## Prerequisites

Run the backend deployment first so the gateway is available at `127.0.0.1:8080`.

The default deployment user is `acm_tracker`, matching the backend deployment templates.

## One-Time Deployment

```bash
cd /opt/wust-algo
git clone https://github.com/everlastingQAQ/WUST-Algo-Frontend.git frontend
cd /opt/wust-algo/frontend

cp deploy/.env.example deploy/.env
nano deploy/.env

sudo apt update
sudo apt install -y nginx gettext-base

bash deploy/scripts/deploy-frontend.sh
```

The script runs:

- `npm ci`
- `npm run build`
- Nginx site installation
- Nginx config test and reload

## Re-Deploy After Code Changes

```bash
cd /opt/wust-algo/frontend
git pull
bash deploy/scripts/deploy-frontend.sh
```

## Nginx Behavior

The generated Nginx site:

- serves `dist/` as the Vue static site
- sends `/api/*` to the backend gateway as `/v1/*`
- supports Vue Router history mode with `try_files ... /index.html`
