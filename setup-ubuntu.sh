#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MAJOR="${NODE_MAJOR:-20}"
PYTHON_VERSION="${PYTHON_VERSION:-3.11}"
PYTHON_BIN="python${PYTHON_VERSION}"

if ! command -v sudo >/dev/null 2>&1; then
  echo "This script expects 'sudo' to be available on Ubuntu."
  exit 1
fi

echo "Installing system packages..."
sudo apt update
sudo apt install -y curl ca-certificates lsof software-properties-common

if ! apt-cache show "${PYTHON_BIN}" >/dev/null 2>&1; then
  echo "Adding deadsnakes PPA for ${PYTHON_BIN}..."
  sudo add-apt-repository -y ppa:deadsnakes/ppa
  sudo apt update
fi

sudo apt install -y "${PYTHON_BIN}" "${PYTHON_BIN}-venv" "${PYTHON_BIN}-dev"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Installing Node.js ${NODE_MAJOR}.x..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "Node.js already installed: $(node -v)"
fi

cd "${ROOT_DIR}"

if [[ -d ".venv" ]]; then
  CURRENT_VENV_VERSION="$("./.venv/bin/python" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)"
  if [[ "${CURRENT_VENV_VERSION}" != "${PYTHON_VERSION}" ]]; then
    echo "Existing .venv uses Python ${CURRENT_VENV_VERSION:-unknown}; recreating it with ${PYTHON_VERSION}..."
    rm -rf .venv
  fi
fi

if [[ ! -d ".venv" ]]; then
  echo "Creating Python virtual environment with ${PYTHON_BIN}..."
  "${PYTHON_BIN}" -m venv .venv
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
echo "Python runtime: $(.venv/bin/python --version)"
echo "Run ./check-env.sh to verify the environment."
echo "Run ./start-dev.sh to start frontend and backend together."
