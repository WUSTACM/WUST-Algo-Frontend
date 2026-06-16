#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
deploy_dir="$(cd "${script_dir}/.." && pwd)"
repo_dir="$(cd "${deploy_dir}/.." && pwd)"

if [[ ! -f "${deploy_dir}/.env" ]]; then
  cp "${deploy_dir}/.env.example" "${deploy_dir}/.env"
  echo "Created ${deploy_dir}/.env from .env.example. Edit it, then rerun this command."
  exit 1
fi

set -a
# shellcheck disable=SC1090,SC1091
source "${deploy_dir}/.env"
set +a

for command_name in envsubst npm sudo nginx systemctl; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}"
    exit 1
  fi
done

run_sudo() {
  if [[ -n "${SUDO_PASSWORD:-}" ]]; then
    printf "%s\n" "${SUDO_PASSWORD}" | sudo -S "$@"
  else
    sudo "$@"
  fi
}

echo "Installing frontend dependencies..."
cd "${repo_dir}"
npm ci --include=dev --no-audit

echo "Checking production dependency audit..."
npm audit --omit=dev --audit-level=high

echo "Building frontend..."
npm run build

echo "Removing build-time dependencies..."
rm -rf node_modules

echo "Installing Nginx site..."
tmp_conf="$(mktemp)"
# shellcheck disable=SC2016
envsubst '${DOMAIN} ${NGINX_PORT} ${APP_ROOT} ${BACKEND_UPSTREAM} ${USER_UPSTREAM} ${CORE_UPSTREAM} ${AGENT_UPSTREAM}' < "${deploy_dir}/nginx/wust-algo.conf.tpl" > "${tmp_conf}"
run_sudo install -m 0644 "${tmp_conf}" "/etc/nginx/sites-available/${NGINX_SITE_NAME}"
rm -f "${tmp_conf}"

run_sudo ln -sfn "/etc/nginx/sites-available/${NGINX_SITE_NAME}" "/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
run_sudo nginx -t
run_sudo systemctl reload nginx

echo "Frontend deployment finished for http://${DOMAIN}:${NGINX_PORT}"
