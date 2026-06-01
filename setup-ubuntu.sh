#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MAJOR="${NODE_MAJOR:-20}"

if ! command -v sudo >/dev/null 2>&1; then
  echo "This script expects 'sudo' to be available on Ubuntu."
  exit 1
fi

echo "Installing system packages..."
sudo apt update
sudo apt install -y curl ca-certificates python3 python3-pip python3-venv lsof

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Installing Node.js ${NODE_MAJOR}.x..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "Node.js already installed: $(node -v)"
fi

cd "${ROOT_DIR}"

if [[ ! -d ".venv" ]]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

echo "Installing backend Python packages..."
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r backend/requirements.txt

echo "Installing frontend npm packages..."
(
  cd frontend
  npm install
)

echo
echo "Setup complete."
echo "Run ./check-env.sh to verify the environment."
echo "Run ./start-dev.sh to start frontend and backend together."
