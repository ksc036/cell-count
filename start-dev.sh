#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
PYTHON_BIN="${PYTHON_BIN:-}"

backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "${frontend_pid}" ]] && kill -0 "${frontend_pid}" 2>/dev/null; then
    kill "${frontend_pid}" 2>/dev/null || true
  fi
  if [[ -n "${backend_pid}" ]] && kill -0 "${backend_pid}" 2>/dev/null; then
    kill "${backend_pid}" 2>/dev/null || true
  fi
}

port_in_use() {
  local port="$1"
  lsof -ti tcp:"${port}" >/dev/null 2>&1
}

pick_python() {
  if [[ -n "${PYTHON_BIN}" ]]; then
    echo "${PYTHON_BIN}"
    return
  fi
  if [[ -x "${ROOT_DIR}/.venv/bin/python" ]]; then
    echo "${ROOT_DIR}/.venv/bin/python"
    return
  fi
  echo "python3"
}

require_command() {
  local command_name="$1"
  local help_text="$2"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}"
    echo "${help_text}"
    exit 1
  fi
}

trap cleanup EXIT INT TERM

require_command "lsof" "Install it first. On Ubuntu: sudo apt update && sudo apt install -y lsof"
require_command "npm" "Install Node.js and npm first. On Ubuntu run ./setup-ubuntu.sh"

PYTHON_CMD="$(pick_python)"
if ! command -v "${PYTHON_CMD}" >/dev/null 2>&1 && [[ ! -x "${PYTHON_CMD}" ]]; then
  echo "Python runtime not found: ${PYTHON_CMD}"
  echo "Run ./setup-ubuntu.sh first, or set PYTHON_BIN to a valid interpreter."
  exit 1
fi

if ! "${PYTHON_CMD}" -m uvicorn --version >/dev/null 2>&1; then
  echo "Python package 'uvicorn' is not available in ${PYTHON_CMD}."
  echo "Run ./setup-ubuntu.sh first, or activate/install the backend environment."
  exit 1
fi

if [[ ! -d "${ROOT_DIR}/frontend/node_modules" ]]; then
  echo "Frontend dependencies are missing: ${ROOT_DIR}/frontend/node_modules"
  echo "Run ./setup-ubuntu.sh first, or run 'cd frontend && npm install'."
  exit 1
fi

if port_in_use "${BACKEND_PORT}"; then
  echo "Backend port ${BACKEND_PORT} is already in use. Stop the existing process first."
  exit 1
fi

if port_in_use "${FRONTEND_PORT}"; then
  echo "Frontend port ${FRONTEND_PORT} is already in use. Stop the existing process first."
  exit 1
fi

cd "${ROOT_DIR}"
"${PYTHON_CMD}" -m uvicorn backend.app.main:app --host "${BACKEND_HOST}" --port "${BACKEND_PORT}" &
backend_pid=$!

(
  cd "${ROOT_DIR}/frontend"
  npm run dev -- --host "${FRONTEND_HOST}" --port "${FRONTEND_PORT}"
) &
frontend_pid=$!

echo "Backend:  http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "Frontend: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "Press Ctrl+C to stop both servers."

wait "${backend_pid}" "${frontend_pid}"
